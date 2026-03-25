'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toggleCrawlJobActive, deleteCrawlJob } from '@/api/actions/crawl'
import { cronToKorean } from '@/lib/cron-utils'
import type { CrawlJob, CrawlSelector } from '@/types/crawl'
import JobDialog from './JobDialog'
import CrawlBeginnerGuide from './CrawlBeginnerGuide'

interface CrawlPageClientProps {
  jobs: CrawlJob[]
}

// 서버/클라이언트 환경 차이 없이 항상 같은 한국어 날짜 문자열을 만듭니다.
function formatKoreanDateTime(value: string) {
  const date = new Date(value)

  // 잘못된 날짜가 들어오면 사용자에게는 원본 값을 보여줍니다.
  if (Number.isNaN(date.getTime())) return value

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour24 = date.getHours()
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  const period = hour24 < 12 ? '오전' : '오후'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12

  return `${year}. ${month}. ${day}. ${period} ${hour12}:${minute}:${second}`
}

export default function CrawlPageClient({ jobs }: CrawlPageClientProps) {
  // ── 추가 다이얼로그 상태 ──
  const [addOpen, setAddOpen] = useState(false)

  // ── 수정 다이얼로그 상태 ──
  const [editJob, setEditJob] = useState<CrawlJob | null>(null)
  const [editSelectors, setEditSelectors] = useState<CrawlSelector[]>([])
  const [editOpen, setEditOpen] = useState(false)

  // ── 삭제 확인 다이얼로그 상태 ──
  const [deleteTarget, setDeleteTarget] = useState<CrawlJob | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [isPending, startTransition] = useTransition()

  // 수정 버튼 클릭: 서버에서 셀렉터 불러오기
  const handleEditClick = async (job: CrawlJob) => {
    try {
      // 셀렉터를 클라이언트에서 직접 fetch
      const res = await fetch(`/api/crawl/selectors?job_id=${job.id}`)
      const data = await res.json()
      setEditJob(job)
      setEditSelectors(data.selectors ?? [])
      setEditOpen(true)
    } catch {
      toast.error('셀렉터 정보를 불러오지 못했습니다.')
    }
  }

  // 활성화 토글
  const handleToggle = (job: CrawlJob, checked: boolean) => {
    startTransition(async () => {
      try {
        await toggleCrawlJobActive(job.id, checked)
        toast.success(checked ? '작업이 활성화됐습니다.' : '작업이 비활성화됐습니다.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '상태 변경에 실패했습니다.')
      }
    })
  }

  // 즉시 실행
  const handleRunNow = (job: CrawlJob) => {
    startTransition(async () => {
      const toastId = toast.loading(`"${job.name}" 실행 중...`)
      try {
        const res = await fetch('/api/crawl/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: job.id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? '실행 실패')
        toast.success(`"${job.name}" 실행 완료!`, { id: toastId })
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : '실행 중 오류가 발생했습니다.',
          { id: toastId }
        )
      }
    })
  }

  // 삭제 실행
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteCrawlJob(deleteTarget.id)
        toast.success(`"${deleteTarget.name}" 작업이 삭제됐습니다.`)
        setDeleteOpen(false)
        setDeleteTarget(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '삭제에 실패했습니다.')
      }
    })
  }

  return (
    <>
      <div className="min-w-0 space-y-6">
      {/* ── 헤더 영역 ── */}
      <div
        id="crawl-header"
        className="rounded-3xl border border-border/60 bg-background/90 p-5 shadow-sm backdrop-blur sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Auto Crawling
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">크롤링 작업 관리</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              수집 작업을 등록하고 스케줄을 관리합니다.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => setAddOpen(true)} className="min-h-10 rounded-xl px-4">
              + 새 작업 추가
            </Button>
          </div>
        </div>
      </div>

      {/* ── 초보자 가이드 ── */}
      <div id="crawl-guide">
        <CrawlBeginnerGuide />
      </div>

      {/* ── 작업 없을 때 빈 화면 ── */}
      {jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background py-20 text-center shadow-sm">
          <p className="mb-2 text-base font-medium tracking-tight">등록된 크롤링 작업이 없습니다.</p>
          <p className="mb-5 text-sm text-muted-foreground">
            첫 작업만 추가하면 나머지는 같은 방식으로 빠르게 늘릴 수 있어요.
          </p>
          <Button onClick={() => setAddOpen(true)} className="rounded-xl px-5">
            첫 번째 작업 추가하기
          </Button>
        </div>
      )}

      {/* ── 작업 카드 목록 ── */}
      <div id="crawl-job-list" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="flex flex-col rounded-3xl border border-border/70 bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-tight tracking-tight break-all">
                  {job.name}
                </CardTitle>
                {/* 활성화 토글 */}
                <Switch
                  checked={job.is_active}
                  onCheckedChange={(checked) => handleToggle(job, checked)}
                  disabled={isPending}
                  aria-label="활성화 토글"
                />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 flex-1">
              {/* URL */}
              <p className="line-clamp-2 break-all rounded-lg bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground">
                🔗 {job.url}
              </p>

              {/* 실행 주기 */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                  {job.cron_expression}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {cronToKorean(job.cron_expression)}
                </span>
              </div>

              {/* 마지막 실행 */}
              <p className="text-xs text-muted-foreground">
                마지막 실행:{' '}
                {job.last_run_at
                  ? formatKoreanDateTime(job.last_run_at)
                  : '없음'}
              </p>

              {/* 상태 배지 */}
              <Badge
                variant={job.is_active ? 'default' : 'outline'}
                className="w-fit rounded-md"
              >
                {job.is_active ? '활성' : '비활성'}
              </Badge>

              {/* 버튼 영역 */}
              <div className="mt-auto flex flex-wrap gap-2 border-t border-border/60 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-10 min-w-0 flex-1 rounded-xl"
                  onClick={() => handleEditClick(job)}
                  disabled={isPending}
                >
                  수정
                </Button>
                <Button
                  size="sm"
                  className="min-h-10 min-w-0 flex-1 rounded-xl"
                  onClick={() => handleRunNow(job)}
                  disabled={isPending}
                >
                  즉시 실행
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="min-h-10 min-w-0 flex-1 rounded-xl"
                  onClick={() => {
                    setDeleteTarget(job)
                    setDeleteOpen(true)
                  }}
                  disabled={isPending}
                >
                  삭제
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>

      {/* ── 작업 추가 다이얼로그 ── */}
      <JobDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* ── 작업 수정 다이얼로그 ── */}
      {editJob && (
        <JobDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          editJob={editJob}
          editSelectors={editSelectors}
        />
      )}

      {/* ── 삭제 확인 다이얼로그 ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작업 삭제 확인</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              &quot;{deleteTarget?.name}&quot;
            </span>{' '}
            작업을 삭제하면 관련된 수집 결과와 로그도 모두 삭제됩니다.
            <br />
            정말 삭제하시겠습니까?
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
            >
              {isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
