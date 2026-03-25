import { describe, expect, it } from 'vitest'
import { buildCrawlDashboardOverview } from '../../lib/crawl-dashboard'
import type { CrawlJob, CrawlLog, CrawlResult } from '../../types/crawl'

function createJob(id: string, isActive: boolean): CrawlJob {
  return {
    id,
    user_id: 'user-1',
    name: `작업-${id}`,
    url: `https://example.com/${id}`,
    cron_expression: '0 * * * *',
    is_active: isActive,
    last_run_at: null,
    created_at: '2026-03-25T00:00:00.000Z',
  }
}

describe('buildCrawlDashboardOverview', () => {
  it('작업/성공률/수집건수를 올바르게 계산한다', () => {
    const jobs = [createJob('job-1', true), createJob('job-2', false)]
    const resultsByJob: Record<string, CrawlResult[]> = {
      'job-1': [
        {
          id: 'result-1',
          job_id: 'job-1',
          run_id: 'run-1',
          data: { title: 'a' },
          crawled_at: '2026-03-25T00:00:00.000Z',
        },
      ],
      'job-2': [],
    }
    const logsByJob: Record<string, CrawlLog[]> = {
      'job-1': [
        {
          id: 'log-1',
          job_id: 'job-1',
          run_id: 'run-1',
          status: 'success',
          message: null,
          error_message: null,
          duration_ms: 1200,
          executed_at: '2026-03-25T00:00:00.000Z',
        },
      ],
      'job-2': [
        {
          id: 'log-2',
          job_id: 'job-2',
          run_id: 'run-2',
          status: 'failed',
          message: null,
          error_message: 'timeout',
          duration_ms: 2200,
          executed_at: '2026-03-24T23:00:00.000Z',
        },
      ],
    }

    const overview = buildCrawlDashboardOverview(jobs, resultsByJob, logsByJob)

    expect(overview.totalJobs).toBe(2)
    expect(overview.activeJobs).toBe(1)
    expect(overview.totalRecentResults).toBe(1)
    expect(overview.recentSuccessRateText).toBe('50%')
    expect(overview.jobSummaries).toHaveLength(2)
  })
})
