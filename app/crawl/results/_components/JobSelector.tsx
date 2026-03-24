'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CrawlJob } from '@/types/crawl'

interface JobSelectorProps {
  jobs: CrawlJob[]
  selectedJobId: string
}

// 작업을 선택하면 URL의 job_id 쿼리 파라미터를 변경 → 서버 컴포넌트 재렌더
export default function JobSelector({ jobs, selectedJobId }: JobSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (jobId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('job_id', jobId)
    router.push(`/crawl/results?${params.toString()}`)
  }

  return (
    <Select value={selectedJobId || ''} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-72">
        <SelectValue placeholder="작업을 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        {jobs.map((job) => (
          <SelectItem key={job.id} value={job.id}>
            {job.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
