 'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AppSideMenuItem {
  href: string
  label: string
}

const APP_SIDE_MENU_ITEMS: AppSideMenuItem[] = [
  { href: '/', label: '대시보드' },
  { href: '/crawl', label: '작업 관리' },
  { href: '/crawl/results', label: '수집 결과' },
]

// 현재 경로와 메뉴 경로를 비교해 매칭되는지 확인합니다.
function isPathMatched(currentPathname: string, menuHref: string): boolean {
  if (menuHref === '/') return currentPathname === '/'
  return currentPathname === menuHref || currentPathname.startsWith(`${menuHref}/`)
}

// 여러 메뉴가 동시에 매칭될 수 있으므로, 가장 구체적인(가장 긴) 경로 1개만 활성화합니다.
function getActiveHref(pathname: string): string | null {
  const matchedItems = APP_SIDE_MENU_ITEMS.filter((item) => isPathMatched(pathname, item.href))
  if (matchedItems.length === 0) return null

  return matchedItems.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null
}

export default function AppSidebar() {
  const pathname = usePathname()
  const activeHref = getActiveHref(pathname)

  return (
    <aside className="w-full lg:w-56 lg:shrink-0">
      <Card className="lg:sticky lg:top-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">사이드 메뉴</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-1">
            {APP_SIDE_MENU_ITEMS.map((item) => {
              const isActive = activeHref === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: isActive ? 'secondary' : 'ghost' }),
                    'shrink-0 w-full justify-start min-h-10',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </CardContent>
      </Card>
    </aside>
  )
}
