import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AppSideMenuItem {
  href: string
  label: string
}

const APP_SIDE_MENU_ITEMS: AppSideMenuItem[] = [
  { href: '/', label: '대시보드' },
  { href: '/crawl', label: '작업 관리' },
  { href: '/crawl/results', label: '수집 결과' },
]

export default function AppSidebar() {
  return (
    <aside className="w-full lg:w-56 lg:shrink-0">
      <Card className="lg:sticky lg:top-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">사이드 메뉴</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-1">
            {APP_SIDE_MENU_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0">
                <Button variant="ghost" className="w-full justify-start min-h-10">
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </CardContent>
      </Card>
    </aside>
  )
}
