'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase'
import type { JobFormData } from '@/types/crawl'

// 단독 사용자 고정 ID (env에서 가져옴)
const getUserId = () => {
  const id = process.env.CRAWL_USER_ID
  if (!id) throw new Error('.env.local에 CRAWL_USER_ID를 설정해주세요.')
  return id
}

// ─────────────────────────────────────────────
// 작업(Job) CRUD
// ─────────────────────────────────────────────

/** 새 크롤링 작업 생성 (셀렉터 포함) */
export async function createCrawlJob(formData: JobFormData) {
  const supabase = createAdminClient()

  // 1단계: 작업 생성
  const { data: job, error: jobError } = await supabase
    .from('crawl_jobs')
    .insert({
      user_id: getUserId(),
      name: formData.name,
      url: formData.url,
      cron_expression: formData.cron_expression,
    })
    .select()
    .single()

  if (jobError) throw new Error(`작업 생성 실패: ${jobError.message}`)

  // 2단계: 셀렉터가 있으면 일괄 삽입
  if (formData.selectors.length > 0) {
    const selectorsToInsert = formData.selectors.map((s) => ({
      job_id: job.id,
      step_order: s.step_order,
      action: s.action,
      selector: s.selector,
      data_type: s.data_type || null,
      field_name: s.field_name || null,
    }))

    const { error: selError } = await supabase
      .from('crawl_selectors')
      .insert(selectorsToInsert)

    if (selError) throw new Error(`셀렉터 저장 실패: ${selError.message}`)
  }

  // 페이지 캐시 무효화 → 목록 새로고침
  revalidatePath('/crawl')
  return job
}

/** 크롤링 작업 수정 (셀렉터는 전체 교체 방식) */
export async function updateCrawlJob(jobId: string, formData: JobFormData) {
  const supabase = createAdminClient()

  // 1단계: 작업 정보 업데이트
  const { error: jobError } = await supabase
    .from('crawl_jobs')
    .update({
      name: formData.name,
      url: formData.url,
      cron_expression: formData.cron_expression,
    })
    .eq('id', jobId)
    .eq('user_id', getUserId())

  if (jobError) throw new Error(`작업 수정 실패: ${jobError.message}`)

  // 2단계: 기존 셀렉터 전부 삭제 후 새로 삽입 (단순 교체 전략)
  const { error: deleteError } = await supabase
    .from('crawl_selectors')
    .delete()
    .eq('job_id', jobId)

  if (deleteError) throw new Error(`셀렉터 삭제 실패: ${deleteError.message}`)

  // 3단계: 새 셀렉터 삽입
  if (formData.selectors.length > 0) {
    const selectorsToInsert = formData.selectors.map((s) => ({
      job_id: jobId,
      step_order: s.step_order,
      action: s.action,
      selector: s.selector,
      data_type: s.data_type || null,
      field_name: s.field_name || null,
    }))

    const { error: selError } = await supabase
      .from('crawl_selectors')
      .insert(selectorsToInsert)

    if (selError) throw new Error(`셀렉터 저장 실패: ${selError.message}`)
  }

  revalidatePath('/crawl')
}

/** 작업 활성화/비활성화 토글 */
export async function toggleCrawlJobActive(jobId: string, isActive: boolean) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('crawl_jobs')
    .update({ is_active: isActive })
    .eq('id', jobId)
    .eq('user_id', getUserId())

  if (error) throw new Error(`활성화 상태 변경 실패: ${error.message}`)

  revalidatePath('/crawl')
}

/** 크롤링 작업 삭제 (연관된 셀렉터·결과·로그는 ON DELETE CASCADE로 자동 삭제) */
export async function deleteCrawlJob(jobId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('crawl_jobs')
    .delete()
    .eq('id', jobId)
    .eq('user_id', getUserId())

  if (error) throw new Error(`작업 삭제 실패: ${error.message}`)

  revalidatePath('/crawl')
  revalidatePath('/crawl/results')
}
