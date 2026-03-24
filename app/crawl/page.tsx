import { getCrawlJobs } from '@/api/queries/crawl'
import CrawlPageClient from './_components/CrawlPageClient'

// 항상 최신 데이터를 보여주기 위해 동적 렌더링 강제
export const dynamic = 'force-dynamic'

export default async function CrawlPage() {
  // 서버에서 직접 조회 (useEffect/useState 불필요)
  const jobs = await getCrawlJobs()

  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto">
      <CrawlPageClient jobs={jobs} />
    </main>
  )
}
