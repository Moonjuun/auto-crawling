'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCrawlJob, updateCrawlJob } from '@/api/actions/crawl'
import { CRON_PRESETS, cronToKorean } from '@/lib/cron-utils'
import type { CrawlJob, CrawlSelector, SelectorFormItem } from '@/types/crawl'

interface JobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // 수정 모드일 때만 전달
  editJob?: CrawlJob
  editSelectors?: CrawlSelector[]
}

// 셀렉터 기본값
const EMPTY_SELECTOR: SelectorFormItem = {
  step_order: 1,
  action: 'extract',
  selector: '',
  data_type: 'text',
  field_name: '',
}

export default function JobDialog({
  open,
  onOpenChange,
  editJob,
  editSelectors,
}: JobDialogProps) {
  const isEdit = !!editJob
  const [isPending, startTransition] = useTransition()

  // ── 폼 상태 ──
  const [name, setName] = useState(editJob?.name ?? '')
  const [url, setUrl] = useState(editJob?.url ?? '')
  const [cronExpr, setCronExpr] = useState(editJob?.cron_expression ?? '*/5 * * * *')
  const [selectors, setSelectors] = useState<SelectorFormItem[]>(
    editSelectors && editSelectors.length > 0
      ? editSelectors.map((s) => ({
          step_order: s.step_order,
          action: s.action,
          selector: s.selector,
          data_type: (s.data_type ?? 'text') as SelectorFormItem['data_type'],
          field_name: s.field_name ?? '',
        }))
      : [{ ...EMPTY_SELECTOR }]
  )

  // 다이얼로그가 열릴 때마다 editJob 값으로 초기화
  const handleOpenChange = (val: boolean) => {
    if (val) {
      setName(editJob?.name ?? '')
      setUrl(editJob?.url ?? '')
      setCronExpr(editJob?.cron_expression ?? '*/5 * * * *')
      setSelectors(
        editSelectors && editSelectors.length > 0
          ? editSelectors.map((s) => ({
              step_order: s.step_order,
              action: s.action,
              selector: s.selector,
              data_type: (s.data_type ?? 'text') as SelectorFormItem['data_type'],
              field_name: s.field_name ?? '',
            }))
          : [{ ...EMPTY_SELECTOR }]
      )
    }
    onOpenChange(val)
  }

  // ── 셀렉터 행 추가 ──
  const addSelector = () => {
    setSelectors((prev) => [
      ...prev,
      { ...EMPTY_SELECTOR, step_order: prev.length + 1 },
    ])
  }

  // ── 셀렉터 행 삭제 ──
  const removeSelector = (index: number) => {
    setSelectors((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, step_order: i + 1 }))
    )
  }

  // ── 셀렉터 필드 변경 ──
  const updateSelector = <K extends keyof SelectorFormItem>(
    index: number,
    key: K,
    value: SelectorFormItem[K]
  ) => {
    setSelectors((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [key]: value } : s))
    )
  }

  // ── 저장 ──
  const handleSubmit = () => {
    // 기본 유효성 검사
    if (!name.trim()) return toast.error('작업 이름을 입력해주세요.')
    if (!url.trim()) return toast.error('크롤링할 URL을 입력해주세요.')
    if (!cronExpr.trim()) return toast.error('실행 주기를 입력해주세요.')

    for (const s of selectors) {
      if (!s.selector.trim()) return toast.error('CSS 셀렉터를 모두 입력해주세요.')
      if (s.action === 'extract' && !s.field_name.trim())
        return toast.error('extract 액션에는 필드명이 필요합니다.')
    }

    startTransition(async () => {
      try {
        const formData = {
          name: name.trim(),
          url: url.trim(),
          cron_expression: cronExpr.trim(),
          selectors,
        }

        if (isEdit && editJob) {
          await updateCrawlJob(editJob.id, formData)
          toast.success('작업이 수정됐습니다.')
        } else {
          await createCrawlJob(formData)
          toast.success('작업이 생성됐습니다.')
        }

        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '저장에 실패했습니다.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '작업 수정' : '새 크롤링 작업 추가'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 작업 이름 */}
          <div className="space-y-1">
            <Label htmlFor="job-name">작업 이름</Label>
            <Input
              id="job-name"
              placeholder="예: 네이버 뉴스 헤드라인"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* URL */}
          <div className="space-y-1">
            <Label htmlFor="job-url">크롤링 URL</Label>
            <Input
              id="job-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* 실행 주기 */}
          <div className="space-y-1">
            <Label>실행 주기 (cron 표현식)</Label>
            {/* 프리셋 선택 */}
            <Select
              value={CRON_PRESETS.some((p) => p.value === cronExpr) ? cronExpr : 'custom'}
              onValueChange={(val) => {
                if (val !== 'custom') setCronExpr(val)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="프리셋 선택" />
              </SelectTrigger>
              <SelectContent>
                {CRON_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">직접 입력</SelectItem>
              </SelectContent>
            </Select>
            {/* 직접 입력 */}
            <Input
              placeholder="* * * * *"
              value={cronExpr}
              onChange={(e) => setCronExpr(e.target.value)}
            />
            {/* 한국어 설명 */}
            <p className="text-xs text-muted-foreground">
              ▶ {cronToKorean(cronExpr)}
            </p>
          </div>

          {/* ── 셀렉터 목록 ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>셀렉터 설정</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSelector}>
                + 행 추가
              </Button>
            </div>

            {selectors.map((sel, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-3 space-y-2 bg-muted/30"
              >
                {/* 행 헤더 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Step {sel.step_order}
                  </span>
                  {selectors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-destructive hover:text-destructive"
                      onClick={() => removeSelector(idx)}
                    >
                      삭제
                    </Button>
                  )}
                </div>

                {/* 액션 + CSS 셀렉터 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">액션</Label>
                    <Select
                      value={sel.action}
                      onValueChange={(val) =>
                        updateSelector(idx, 'action', val as 'click' | 'extract')
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="click">click (클릭)</SelectItem>
                        <SelectItem value="extract">extract (수집)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">CSS 셀렉터</Label>
                    <Input
                      className="h-8 text-xs font-mono"
                      placeholder=".news-title, #price, table tr"
                      value={sel.selector}
                      onChange={(e) => updateSelector(idx, 'selector', e.target.value)}
                    />
                  </div>
                </div>

                {/* extract 전용: data_type + field_name */}
                {sel.action === 'extract' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">데이터 타입</Label>
                      <Select
                        value={sel.data_type || 'text'}
                        onValueChange={(val) =>
                          updateSelector(
                            idx,
                            'data_type',
                            val as SelectorFormItem['data_type']
                          )
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">text (텍스트)</SelectItem>
                          <SelectItem value="image_url">image_url (이미지 URL)</SelectItem>
                          <SelectItem value="href">href (링크 URL)</SelectItem>
                          <SelectItem value="table">table (테이블)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">필드명 (결과 키)</Label>
                      <Input
                        className="h-8 text-xs"
                        placeholder="예: title, price"
                        value={sel.field_name}
                        onChange={(e) => updateSelector(idx, 'field_name', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? '저장 중...' : isEdit ? '수정 완료' : '작업 추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
