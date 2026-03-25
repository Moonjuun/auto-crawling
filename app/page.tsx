import Link from 'next/link'
import { getCrawlJobs, getCrawlLogs, getCrawlResults } from '@/api/queries/crawl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buildCrawlDashboardOverview, type CrawlDashboardJobSummary } from '@/lib/crawl-dashboard'

// 대시보드는 최신 현황을 보여줘야 하므로 동적 렌더링을 사용합니다.
export const dynamic = 'force-dynamic'

function formatDateTime(value: string | null): string {
  if (!value) return '기록 없음'
  return new Date(value).toLocaleString('ko-KR')
}

function statusLabel(status: CrawlDashboardJobSummary['latestStatus']): string {
  if (!status) return '실행 이력 없음'
  if (status === 'success') return '성공'
  if (status === 'failed') return '실패'
  return '부분 성공'
}

function statusVariant(status: CrawlDashboardJobSummary['latestStatus']) {
  if (!status) return 'outline' as const
  if (status === 'success') return 'default' as const
  if (status === 'failed') return 'destructive' as const
  return 'secondary' as const
}

export default async function Home() {
  // 1) 작업 목록을 먼저 가져옵니다.
  const jobs = await getCrawlJobs()

  // 2) 각 작업별 최근 결과/로그를 병렬 조회해서 대시보드 카드에 필요한 수치를 만듭니다.
  const detailList = await Promise.all(
    jobs.map(async (job) => {
      const [results, logs] = await Promise.all([getCrawlResults(job.id), getCrawlLogs(job.id)])
      return { jobId: job.id, results, logs }
    }),
  )

  const resultsByJob = Object.fromEntries(detailList.map((item) => [item.jobId, item.results]))
  const logsByJob = Object.fromEntries(detailList.map((item) => [item.jobId, item.logs]))

  const overview = buildCrawlDashboardOverview(jobs, resultsByJob, logsByJob)

  return (
    <main className="min-h-full space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">크롤링 대시보드</h1>
          <p className="text-sm text-muted-foreground">
            작업 상태, 최근 실행 결과, 실패 여부를 한 화면에서 확인합니다.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/crawl" className="w-full sm:w-auto">
            <Button className="w-full">작업 관리 열기</Button>
          </Link>
          <Link href="/crawl/results" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              결과 상세 보기
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전체 작업</CardDescription>
            <CardTitle>{overview.totalJobs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>활성 작업</CardDescription>
            <CardTitle>{overview.activeJobs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>최근 수집 건수</CardDescription>
            <CardTitle>{overview.totalRecentResults}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>최근 실행 성공률</CardDescription>
            <CardTitle>{overview.recentSuccessRateText}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">작업별 상태</CardTitle>
          <CardDescription>최근 실행 기준으로 실패 작업을 빠르게 확인할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.jobSummaries.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-8 text-center">
              <p className="text-muted-foreground">등록된 작업이 없습니다.</p>
              <p className="text-xs text-muted-foreground mt-1">
                먼저 작업 관리에서 URL과 셀렉터를 추가해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {overview.jobSummaries.map((summary) => (
                <div
                  key={summary.job.id}
                  className="rounded-xl border p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold truncate">{summary.job.name}</h2>
                      <Badge variant={summary.job.is_active ? 'default' : 'secondary'}>
                        {summary.job.is_active ? '활성' : '중지'}
                      </Badge>
                      <Badge variant={statusVariant(summary.latestStatus)}>
                        {statusLabel(summary.latestStatus)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{summary.job.url}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm min-w-0 lg:w-[480px]">
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-xs text-muted-foreground">최근 실행</p>
                      <p className="truncate">{formatDateTime(summary.latestExecutedAt)}</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-xs text-muted-foreground">최근 수집 건수</p>
                      <p>{summary.recentResultCount}건</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-xs text-muted-foreground">총 실행 횟수</p>
                      <p>{summary.logCount}회</p>
                    </div>
                  </div>

                  <Link
                    href={{ pathname: '/crawl/results', query: { job_id: summary.job.id } }}
                    className="w-full lg:w-auto"
                  >
                    <Button variant="outline" className="w-full lg:w-auto">
                      결과 보기
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
