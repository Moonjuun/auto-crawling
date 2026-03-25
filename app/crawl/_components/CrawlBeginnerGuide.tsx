import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GuideItem {
  title: string
  description: string
  imageSrc: string
  imageAlt: string
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    title: '1단계: F12로 개발자도구 열기',
    description:
      '크롤링할 페이지에서 F12를 눌러 개발자도구를 열고, 왼쪽 상단 화살표(요소 선택) 버튼을 누른 뒤 가져오고 싶은 제목/가격/링크를 클릭하세요.',
    imageSrc: '/images/crawl-step-create.svg',
    imageAlt: '개발자도구에서 요소를 선택하는 단계 이미지',
  },
  {
    title: '2단계: 선택자(Selector) 복사하기',
    description:
      '원하는 텍스트(제목/본문/날짜)에서 우클릭 후 검사(Inspect)로 해당 태그를 정확히 찾고, Elements 패널에서 그 태그를 우클릭해 Copy > Copy selector를 누르세요. 복사한 선택자는 console에서 document.querySelector("선택자")?.innerText로 바로 검증할 수 있습니다. 값이 null이면 선택자가 틀렸거나 아직 렌더링 전일 수 있으니, id/class/data-* 기반의 더 안정적인 선택자로 다시 복사해 항목별로 정리하세요.',
    imageSrc: '/images/crawl-step-run.svg',
    imageAlt: '선택자를 복사하는 단계 이미지',
  },
  {
    title: '3단계: 선택자 붙여넣고 미리보기 확인',
    description:
      '복사한 선택자를 셀렉터 입력칸에 붙여넣은 뒤 미리보기/즉시 실행으로 값이 정확히 나오는지 먼저 확인합니다. 값이 비어 있으면 다른 부모 요소를 다시 선택해보세요.',
    imageSrc: '/images/crawl-step-result.svg',
    imageAlt: '선택자를 입력하고 결과를 확인하는 단계 이미지',
  },
]

export default function CrawlBeginnerGuide() {
  return (
    <section className="mb-8 rounded-3xl border border-border/60 bg-background/90 p-5 shadow-sm backdrop-blur sm:p-6">
      <details className="group">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                처음 쓰는 분을 위한 3분 가이드
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                크롤링이 처음이라면 눌러서 가이드를 펼쳐보세요.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition group-open:bg-muted">
              펼치기 / 접기
            </span>
          </div>
        </summary>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {GUIDE_ITEMS.map((item) => (
            <Card
              key={item.title}
              className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm"
            >
              <div className="relative h-40 w-full bg-muted/30">
                <Image src={item.imageSrc} alt={item.imageAlt} fill className="object-contain p-5" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base tracking-tight">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </details>
    </section>
  )
}
