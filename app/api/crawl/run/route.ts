import { type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// Vercel에서 최대 실행 시간 60초 설정 (Playwright 실행 시간 고려)
export const maxDuration = 60

// ─────────────────────────────────────────────
// 단계별 로그 출력 헬퍼 (터미널 + 타임스탬프)
// ─────────────────────────────────────────────
function log(runId: string, step: string, detail?: string) {
  const time = new Date().toISOString().slice(11, 23) // HH:MM:SS.mmm
  const msg = detail ? `[${time}] [${runId.slice(0, 6)}] ${step} — ${detail}` : `[${time}] [${runId.slice(0, 6)}] ${step}`
  console.log(msg)
  return msg
}

// ─────────────────────────────────────────────
// 브라우저 실행 함수 (로컬 / Vercel 환경 분기)
// ─────────────────────────────────────────────
async function launchBrowser() {
  if (process.env.VERCEL) {
    // Vercel 배포 환경: @sparticuz/chromium으로 헤드리스 Chromium 실행
    const chromium = (await import('@sparticuz/chromium')).default
    const { chromium: playwrightChromium } = await import('playwright-core')
    return playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  } else {
    // 로컬 환경: playwright-core + 시스템에 설치된 Chrome 사용
    const { chromium } = await import('playwright-core')
    return chromium.launch({ headless: true })
  }
}

// ─────────────────────────────────────────────
// POST /api/crawl/run
// Body: { job_id: string }
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  // 실행마다 새 UUID 생성 (여러 결과 레코드를 같은 run으로 묶기 위함)
  const runId = crypto.randomUUID()

  // ── 1. 요청 파싱 ──
  let jobId: string
  try {
    const body = await request.json()
    jobId = body.job_id
    if (!jobId) {
      return Response.json({ error: 'job_id가 필요합니다.' }, { status: 400 })
    }
  } catch {
    return Response.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  // 단계별 로그 메시지를 쌓아두는 배열
  const stepMessages: string[] = []

  const supabase = createAdminClient()

  // ── 2. 작업 정보 조회 ──
  const { data: job, error: jobError } = await supabase
    .from('crawl_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    return Response.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 })
  }

  stepMessages.push(log(runId, '작업 시작', `"${job.name}" → ${job.url}`))

  // ── 3. 셀렉터 조회 ──
  const { data: selectors, error: selError } = await supabase
    .from('crawl_selectors')
    .select('*')
    .eq('job_id', jobId)
    .order('step_order', { ascending: true })

  if (selError) {
    return Response.json({ error: '셀렉터 조회에 실패했습니다.' }, { status: 500 })
  }

  stepMessages.push(log(runId, '셀렉터 로드', `총 ${selectors?.length ?? 0}개`))

  let browser
  try {
    // ── 4. 브라우저 실행 ──
    stepMessages.push(log(runId, '브라우저 시작'))
    browser = await launchBrowser()
    const page = await browser.newPage()

    // 타임아웃 50초 (maxDuration 60초보다 여유 있게)
    page.setDefaultTimeout(50_000)

    // ── 5. 대상 URL 로드 ──
    stepMessages.push(log(runId, '페이지 이동', job.url))
    // networkidle은 광고·트래킹 요청이 많은 사이트에서 타임아웃 발생
    // load(기본 리소스 로드 완료)로 변경
    // domcontentloaded: HTML 파싱 완료 시점 → 광고·트래킹 스크립트를 기다리지 않아 빠름
    await page.goto(job.url, { waitUntil: 'domcontentloaded' })
    stepMessages.push(log(runId, '페이지 로드 완료'))

    // 수집된 데이터를 담을 객체
    const collectedData: Record<string, unknown> = {}

    // ── 6. 셀렉터 순서대로 실행 ──
    for (const sel of selectors ?? []) {
      if (sel.action === 'click') {
        stepMessages.push(log(runId, `[Step ${sel.step_order}] 클릭`, sel.selector))
        // 클릭 후 페이지 로딩 대기
        await page.click(sel.selector)
        await page.waitForLoadState('domcontentloaded').catch(() => {
          // 로드 타임아웃은 무시하고 계속 진행
        })
        stepMessages.push(log(runId, `[Step ${sel.step_order}] 클릭 완료`))
      } else if (sel.action === 'extract') {
        // 필드명이 없으면 step_order로 대체
        const fieldName = sel.field_name ?? `field_${sel.step_order}`
        stepMessages.push(log(runId, `[Step ${sel.step_order}] 추출 시작`, `필드: ${fieldName} | 타입: ${sel.data_type} | 셀렉터: ${sel.selector}`))

        if (sel.data_type === 'table') {
          // 테이블: 각 행의 셀 텍스트를 2차원 배열로 추출
          const tableData = await page.$$eval(sel.selector, (rows) =>
            rows.map((row) =>
              Array.from(row.querySelectorAll('td, th')).map(
                (cell) => (cell as HTMLElement).textContent?.trim() ?? ''
              )
            )
          )
          collectedData[fieldName] = tableData
          stepMessages.push(log(runId, `[Step ${sel.step_order}] 테이블 추출 완료`, `${tableData.length}행`))
        } else if (sel.data_type === 'image_url') {
          // 이미지: src 속성 추출
          const values = await page.$$eval(sel.selector, (els) =>
            els.map((el) => (el as HTMLImageElement).src)
          )
          // 단일 요소면 문자열, 복수면 배열
          collectedData[fieldName] = values.length === 1 ? values[0] : values
          stepMessages.push(log(runId, `[Step ${sel.step_order}] 이미지 추출 완료`, `${values.length}개`))
        } else if (sel.data_type === 'href') {
          // 링크: href 속성 추출
          const values = await page.$$eval(sel.selector, (els) =>
            els.map((el) => (el as HTMLAnchorElement).href)
          )
          collectedData[fieldName] = values.length === 1 ? values[0] : values
          stepMessages.push(log(runId, `[Step ${sel.step_order}] 링크 추출 완료`, `${values.length}개`))
        } else {
          // 기본: 텍스트 내용 추출
          const values = await page.$$eval(sel.selector, (els) =>
            els.map((el) => el.textContent?.trim() ?? '')
          )
          collectedData[fieldName] = values.length === 1 ? values[0] : values
          stepMessages.push(log(runId, `[Step ${sel.step_order}] 텍스트 추출 완료`, `${values.length}개`))
        }
      }
    }

    stepMessages.push(log(runId, '데이터 수집 완료', `필드 ${Object.keys(collectedData).length}개`))

    // ── 7. 결과 저장 ──
    stepMessages.push(log(runId, 'DB 저장 중'))
    const { error: resultError } = await supabase.from('crawl_results').insert({
      job_id: jobId,
      run_id: runId,
      data: collectedData,
    })

    if (resultError) throw new Error(`결과 저장 실패: ${resultError.message}`)

    // ── 8. 성공 로그 저장 ──
    const duration = Date.now() - startTime
    stepMessages.push(log(runId, '완료', `총 ${(duration / 1000).toFixed(1)}초`))

    await supabase.from('crawl_logs').insert({
      job_id: jobId,
      run_id: runId,
      status: 'success',
      message: stepMessages.join('\n'),
      duration_ms: duration,
    })

    // ── 9. last_run_at 업데이트 ──
    await supabase
      .from('crawl_jobs')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', jobId)

    return Response.json({ success: true, run_id: runId, data: collectedData })
  } catch (error) {
    // ── 실패 시: 에러 로그 저장 ──
    const duration = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'

    stepMessages.push(log(runId, '❌ 오류 발생', errorMessage))

    await supabase.from('crawl_logs').insert({
      job_id: jobId,
      run_id: runId,
      status: 'failed',
      message: stepMessages.join('\n'),
      error_message: errorMessage,
      duration_ms: duration,
    })

    // last_run_at도 실패 시 업데이트
    await supabase
      .from('crawl_jobs')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', jobId)

    return Response.json({ error: errorMessage }, { status: 500 })
  } finally {
    // 브라우저는 항상 닫기
    if (browser) await browser.close()
  }
}
