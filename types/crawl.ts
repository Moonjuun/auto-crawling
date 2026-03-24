// ─────────────────────────────────────────────
// DB 테이블 타입 (실제 컬럼명과 1:1 매핑)
// ─────────────────────────────────────────────

/** crawl_jobs 테이블 */
export interface CrawlJob {
  id: string
  user_id: string
  name: string
  url: string
  cron_expression: string
  is_active: boolean
  last_run_at: string | null
  created_at: string
}

/** crawl_selectors 테이블 */
export interface CrawlSelector {
  id: string
  job_id: string
  step_order: number
  action: 'click' | 'extract'
  selector: string
  data_type: 'text' | 'image_url' | 'href' | 'table' | null
  field_name: string | null
  created_at: string
}

/** crawl_results 테이블 */
export interface CrawlResult {
  id: string
  job_id: string
  run_id: string
  data: Record<string, unknown>
  crawled_at: string
}

/** crawl_logs 테이블 */
export interface CrawlLog {
  id: string
  job_id: string
  run_id: string
  status: 'success' | 'failed' | 'partial'
  message: string | null
  error_message: string | null
  duration_ms: number | null
  executed_at: string
}

// ─────────────────────────────────────────────
// 폼 입력용 타입
// ─────────────────────────────────────────────

/** 셀렉터 폼 한 행 */
export interface SelectorFormItem {
  step_order: number
  action: 'click' | 'extract'
  selector: string
  data_type: 'text' | 'image_url' | 'href' | 'table' | ''
  field_name: string
}

/** 작업 추가/수정 폼 */
export interface JobFormData {
  name: string
  url: string
  cron_expression: string
  selectors: SelectorFormItem[]
}

/** 결과 run_id 그룹 (UI 표시용) */
export interface ResultGroup {
  run_id: string
  crawled_at: string
  items: CrawlResult[]
  // data의 모든 키를 모아둔 컬럼 목록
  columns: string[]
}
