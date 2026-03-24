import { Suspense } from 'react'
import Link from 'next/link'
import { getCrawlJobs, getCrawlResults, getCrawlLogs } from '@/api/queries/crawl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ResultGroup, CrawlResult, CrawlLog } from '@/types/crawl'
import JobSelector from './_components/JobSelector'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────
// run_id 기준으로 결과를 그룹핑
// ─────────────────────────────────────────────
function groupResultsByRun(results: CrawlResult[]): ResultGroup[] {
  const map = new Map<string, CrawlResult[]>()

  for (const r of results) {
    if (!map.has(r.run_id)) map.set(r.run_id, [])
    map.get(r.run_id)!.push(r)
  }

  return Array.from(map.entries()).map(([run_id, items]) => {
    // 모든 data 객체의 키를 모아 컬럼 목록 생성
    const keySet = new Set<string>()
    for (const item of items) {
      Object.keys(item.data).forEach((k) => keySet.add(k))
    }
    return {
      run_id,
      crawled_at: items[0].crawled_at,
      items,
      columns: Array.from(keySet),
    }
  })
}

// ─────────────────────────────────────────────
// 로그 상태에 따른 배지 색상
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: CrawlLog['status'] }) {
  const variants = {
    success: 'default',
    failed: 'destructive',
    partial: 'secondary',
  } as const

  const labels = {
    success: '성공',
    failed: '실패',
    partial: '부분 성공',
  }

  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

// ─────────────────────────────────────────────
// 셀 값 렌더링 (배열/객체/문자열 처리)
// ─────────────────────────────────────────────
function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground text-xs">-</span>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground text-xs">[]</span>
    // 2차원 배열(table 타입)
    if (Array.isArray(value[0])) {
      return (
        <div className="overflow-x-auto max-w-xs">
          <table className="text-xs border-collapse">
            <tbody>
              {(value as string[][]).slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-1 py-0.5 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {value.length > 5 && (
                <tr>
                  <td className="text-muted-foreground px-1">
                    ...외 {value.length - 5}행
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )
    }
    return (
      <ul className="text-xs list-disc list-inside max-w-xs">
        {(value as unknown[]).slice(0, 5).map((v, i) => (
          <li key={i} className="truncate">{String(v)}</li>
        ))}
        {value.length > 5 && (
          <li className="text-muted-foreground">...외 {value.length - 5}개</li>
        )}
      </ul>
    )
  }
  if (typeof value === 'object') {
    return (
      <pre className="text-xs max-w-xs overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }
  return <span className="text-xs">{String(value)}</span>
}

// ─────────────────────────────────────────────
// 메인 페이지 컴포넌트
// ─────────────────────────────────────────────
export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ job_id?: string }>
}) {
  // Next.js 16: searchParams는 Promise
  const { job_id } = await searchParams

  // 서버에서 직접 조회
  const jobs = await getCrawlJobs()
  const results = job_id ? await getCrawlResults(job_id) : []
  const logs = job_id ? await getCrawlLogs(job_id) : []

  // 선택된 작업 이름
  const selectedJob = jobs.find((j) => j.id === job_id)

  // 결과를 run_id 기준으로 그룹핑
  const groups = groupResultsByRun(results)

  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto">
      {/* ── 헤더 ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">수집 결과</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedJob
              ? `"${selectedJob.name}"의 수집 결과`
              : '작업을 선택하면 결과를 볼 수 있습니다.'}
          </p>
        </div>
        <Link href="/crawl">
          <Button variant="outline" size="sm">
            ← 작업 관리로
          </Button>
        </Link>
      </div>

      {/* ── 작업 선택 드롭다운 ── */}
      <div className="mb-6">
        <Suspense fallback={<div className="w-72 h-10 bg-muted animate-pulse rounded" />}>
          <JobSelector jobs={jobs} selectedJobId={job_id ?? ''} />
        </Suspense>
      </div>

      {!job_id && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">위에서 작업을 선택해주세요.</p>
        </div>
      )}

      {job_id && (
        <Tabs defaultValue="results">
          <TabsList className="mb-4">
            <TabsTrigger value="results">
              수집 결과{' '}
              <Badge variant="secondary" className="ml-1">
                {results.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="logs">
              실행 로그{' '}
              <Badge variant="secondary" className="ml-1">
                {logs.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* ── 수집 결과 탭 ── */}
          <TabsContent value="results">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground">아직 수집된 결과가 없습니다.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  작업 관리 페이지에서 즉시 실행해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((group) => (
                  <div key={group.run_id} className="border rounded-xl overflow-hidden">
                    {/* run 헤더 */}
                    <div className="bg-muted/50 px-4 py-2 flex flex-wrap items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">
                        Run: {group.run_id.slice(0, 8)}...
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(group.crawled_at).toLocaleString('ko-KR')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {group.items.length}건
                      </Badge>
                    </div>

                    {/* 결과 테이블 (모바일: 가로 스크롤) */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {group.columns.map((col) => (
                              <TableHead key={col} className="whitespace-nowrap text-xs">
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map((item) => (
                            <TableRow key={item.id}>
                              {group.columns.map((col) => (
                                <TableCell key={col} className="align-top py-2">
                                  <CellValue value={item.data[col]} />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── 실행 로그 탭 ── */}
          <TabsContent value="logs">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground">실행 이력이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">상태</TableHead>
                      <TableHead className="whitespace-nowrap">실행 시각</TableHead>
                      <TableHead className="whitespace-nowrap">소요 시간</TableHead>
                      <TableHead className="whitespace-nowrap">Run ID</TableHead>
                      <TableHead className="whitespace-nowrap">단계별 로그</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(log.executed_at).toLocaleString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.duration_ms != null
                            ? `${(log.duration_ms / 1000).toFixed(1)}초`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {log.run_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-xs max-w-sm">
                          {/* 단계별 실행 로그 */}
                          {log.message ? (
                            <pre className="whitespace-pre-wrap text-muted-foreground text-[11px] leading-relaxed">
                              {log.message}
                            </pre>
                          ) : '-'}
                          {/* 에러 메시지 별도 강조 */}
                          {log.error_message && (
                            <p className="text-destructive mt-1">{log.error_message}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}
