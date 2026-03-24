import { type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// ─────────────────────────────────────────────
// cron 표현식과 현재 시각이 일치하는지 확인
// 지원 형식: * / */n / n-m / n,m,k (분·시·일·월·요일)
// ─────────────────────────────────────────────
function cronMatches(expression: string, now: Date): boolean {
  const parts = expression.trim().split(/\s+/)
  // cron은 5개 필드 (분 시 일 월 요일)
  if (parts.length !== 5) return false

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts

  // 단일 필드값이 현재값과 일치하는지 판단
  function matchField(field: string, value: number): boolean {
    // 와일드카드: 항상 일치
    if (field === '*') return true

    // 인터벌: */5 → 0, 5, 10, ...
    if (field.startsWith('*/')) {
      const interval = parseInt(field.slice(2), 10)
      return value % interval === 0
    }

    // 범위: 1-5
    if (field.includes('-') && !field.includes(',')) {
      const [start, end] = field.split('-').map(Number)
      return value >= start && value <= end
    }

    // 목록: 1,3,5
    if (field.includes(',')) {
      return field.split(',').map(Number).includes(value)
    }

    // 단일 숫자
    return parseInt(field, 10) === value
  }

  return (
    matchField(minute, now.getMinutes()) &&
    matchField(hour, now.getHours()) &&
    matchField(dayOfMonth, now.getDate()) &&
    matchField(month, now.getMonth() + 1) && // Date는 0-based
    matchField(dayOfWeek, now.getDay()) // 0=일, 6=토
  )
}

// ─────────────────────────────────────────────
// GET /api/crawl/cron
// Vercel Cron이 매 분마다 호출 (vercel.json 참고)
// ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // Vercel Cron 요청 인증 (CRON_SECRET 설정 시)
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  // 현재 시각 (한국 시간으로 처리하려면 UTC+9 보정 가능, 여기선 UTC 기준)
  const now = new Date()

  // 활성화된 작업 목록만 조회
  const { data: jobs, error } = await supabase
    .from('crawl_jobs')
    .select('id, cron_expression, last_run_at')
    .eq('is_active', true)

  if (error) {
    console.error('활성 작업 조회 실패:', error.message)
    return Response.json({ error: '작업 조회 실패' }, { status: 500 })
  }

  // 실행된 작업 ID 목록
  const triggered: string[] = []
  // 실패한 작업 ID 목록
  const failed: string[] = []

  // 베이스 URL 결정 (Vercel 배포 / 로컬 개발)
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  for (const job of jobs ?? []) {
    // cron 표현식과 현재 분이 일치하면 실행
    if (cronMatches(job.cron_expression, now)) {
      try {
        // /api/crawl/run을 서버 내부에서 POST 호출
        const res = await fetch(`${baseUrl}/api/crawl/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: job.id }),
        })

        if (!res.ok) {
          console.error(`작업 ${job.id} 실행 응답 오류: ${res.status}`)
          failed.push(job.id)
        } else {
          triggered.push(job.id)
        }
      } catch (err) {
        console.error(`작업 ${job.id} 실행 중 오류:`, err)
        failed.push(job.id)
      }
    }
  }

  return Response.json({
    triggered,
    failed,
    total_active: jobs?.length ?? 0,
    checked_at: now.toISOString(),
  })
}
