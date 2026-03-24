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
import Link from 'next/link'

interface CrawlPageClientProps {
  jobs: CrawlJob[]
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
      {/* ── 헤더 영역 ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">크롤링 작업 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            수집 작업을 등록하고 스케줄을 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/crawl/results">
            <Button variant="outline" size="sm">
              수집 결과 보기
            </Button>
          </Link>
          <Button onClick={() => setAddOpen(true)}>+ 새 작업 추가</Button>
        </div>
      </div>

      {/* ── 작업 없을 때 빈 화면 ── */}
      {jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground mb-4">등록된 크롤링 작업이 없습니다.</p>
          <Button onClick={() => setAddOpen(true)}>첫 번째 작업 추가하기</Button>
        </div>
      )}

      {/* ── 작업 카드 목록 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-tight break-all">
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
              <p className="text-xs text-muted-foreground break-all line-clamp-2">
                🔗 {job.url}
              </p>

              {/* 실행 주기 */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="font-mono text-xs">
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
                  ? new Date(job.last_run_at).toLocaleString('ko-KR')
                  : '없음'}
              </p>

              {/* 상태 배지 */}
              <Badge
                variant={job.is_active ? 'default' : 'outline'}
                className="w-fit"
              >
                {job.is_active ? '활성' : '비활성'}
              </Badge>

              {/* 버튼 영역 */}
              <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 min-w-0"
                  onClick={() => handleEditClick(job)}
                  disabled={isPending}
                >
                  수정
                </Button>
                <Button
                  size="sm"
                  className="flex-1 min-w-0"
                  onClick={() => handleRunNow(job)}
                  disabled={isPending}
                >
                  즉시 실행
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 min-w-0"
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
              "{deleteTarget?.name}"
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
