import type { CrawlJob, CrawlLog, CrawlResult } from '@/types/crawl'

export interface CrawlDashboardJobSummary {
  job: CrawlJob
  logCount: number
  recentResultCount: number
  latestStatus: CrawlLog['status'] | null
  latestExecutedAt: string | null
}

export interface CrawlDashboardOverview {
  totalJobs: number
  activeJobs: number
  totalRecentResults: number
  recentSuccessRateText: string
  jobSummaries: CrawlDashboardJobSummary[]
}

// 작업별 데이터를 한 번에 요약해 메인 대시보드에 사용합니다.
export function buildCrawlDashboardOverview(
  jobs: CrawlJob[],
  resultsByJob: Record<string, CrawlResult[]>,
  logsByJob: Record<string, CrawlLog[]>,
): CrawlDashboardOverview {
  const jobSummaries: CrawlDashboardJobSummary[] = jobs.map((job) => {
    const results = resultsByJob[job.id] ?? []
    const logs = logsByJob[job.id] ?? []
    const latestLog = logs[0] ?? null

    return {
      job,
      logCount: logs.length,
      recentResultCount: results.length,
      latestStatus: latestLog?.status ?? null,
      latestExecutedAt: latestLog?.executed_at ?? null,
    }
  })

  const activeJobs = jobs.filter((job) => job.is_active).length
  const totalRecentResults = jobSummaries.reduce((sum, item) => sum + item.recentResultCount, 0)
  const logsWithStatus = jobSummaries.filter((item) => item.latestStatus !== null).length
  const successLogs = jobSummaries.filter((item) => item.latestStatus === 'success').length
  const successRate =
    logsWithStatus === 0 ? 0 : Math.round((successLogs / logsWithStatus) * 100)

  return {
    totalJobs: jobs.length,
    activeJobs,
    totalRecentResults,
    recentSuccessRateText: logsWithStatus === 0 ? '데이터 없음' : `${successRate}%`,
    jobSummaries,
  }
}
