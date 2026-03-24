'use server'

import { createAdminClient } from '@/lib/supabase'
import type { CrawlJob, CrawlSelector, CrawlResult, CrawlLog } from '@/types/crawl'

// 단독 사용자 고정 ID (env에서 가져옴)
const getUserId = () => {
  const id = process.env.CRAWL_USER_ID
  if (!id) throw new Error('.env.local에 CRAWL_USER_ID를 설정해주세요.')
  return id
}

// ─────────────────────────────────────────────
// crawl_jobs 조회
// ─────────────────────────────────────────────

/** 모든 크롤링 작업 목록을 최신순으로 가져옵니다 */
export async function getCrawlJobs(): Promise<CrawlJob[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('crawl_jobs')
    .select('*')
    .eq('user_id', getUserId())
    .order('created_at', { ascending: false })

  if (error) throw new Error(`작업 목록 조회 실패: ${error.message}`)
  return data ?? []
}

/** 특정 작업 단건 조회 */
export async function getCrawlJobById(jobId: string): Promise<CrawlJob | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('crawl_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', getUserId())
    .single()

  if (error) return null
  return data
}

// ─────────────────────────────────────────────
// crawl_selectors 조회
// ─────────────────────────────────────────────

/** 특정 작업의 셀렉터 목록을 step_order 순으로 가져옵니다 */
export async function getCrawlSelectors(jobId: string): Promise<CrawlSelector[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('crawl_selectors')
    .select('*')
    .eq('job_id', jobId)
    .order('step_order', { ascending: true })

  if (error) throw new Error(`셀렉터 조회 실패: ${error.message}`)
  return data ?? []
}

// ─────────────────────────────────────────────
// crawl_results 조회
// ─────────────────────────────────────────────

/** 특정 작업의 수집 결과 최근 200건 조회 */
export async function getCrawlResults(jobId: string): Promise<CrawlResult[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('crawl_results')
    .select('*')
    .eq('job_id', jobId)
    .order('crawled_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(`결과 조회 실패: ${error.message}`)
  return data ?? []
}

// ─────────────────────────────────────────────
// crawl_logs 조회
// ─────────────────────────────────────────────

/** 특정 작업의 실행 로그 최근 50건 조회 */
export async function getCrawlLogs(jobId: string): Promise<CrawlLog[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('crawl_logs')
    .select('*')
    .eq('job_id', jobId)
    .order('executed_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(`로그 조회 실패: ${error.message}`)
  return data ?? []
}
