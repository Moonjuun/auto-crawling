import { type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET /api/crawl/selectors?job_id=xxx
// 특정 작업의 셀렉터 목록을 반환 (수정 다이얼로그에서 사용)
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('job_id')
  if (!jobId) {
    return Response.json({ error: 'job_id가 필요합니다.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('crawl_selectors')
    .select('*')
    .eq('job_id', jobId)
    .order('step_order', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ selectors: data ?? [] })
}
