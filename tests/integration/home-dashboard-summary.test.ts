import { describe, expect, it } from 'vitest'
import { buildCrawlDashboardOverview } from '../../lib/crawl-dashboard'
import type { CrawlJob } from '../../types/crawl'

function createJob(id: string): CrawlJob {
  return {
    id,
    user_id: 'user-1',
    name: `작업-${id}`,
    url: `https://example.com/${id}`,
    cron_expression: '0 * * * *',
    is_active: true,
    last_run_at: null,
    created_at: '2026-03-25T00:00:00.000Z',
  }
}

describe('home dashboard integration summary', () => {
  it('로그가 없을 때 성공률을 데이터 없음으로 반환한다', () => {
    const jobs = [createJob('job-1')]
    const overview = buildCrawlDashboardOverview(jobs, { 'job-1': [] }, { 'job-1': [] })

    expect(overview.totalJobs).toBe(1)
    expect(overview.recentSuccessRateText).toBe('데이터 없음')
    expect(overview.jobSummaries[0].latestStatus).toBeNull()
  })
})
