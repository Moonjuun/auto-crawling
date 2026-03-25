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
      '선택된 HTML 요소에서 우클릭 후 Copy > Copy selector를 눌러 선택자를 복사합니다. 같은 방식으로 제목, 본문, 날짜 등 필요한 항목을 각각 준비하세요.',
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
    <section className="mb-6 rounded-2xl border bg-muted/30 p-4 sm:p-5">
      <details>
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">처음 쓰는 분을 위한 3분 가이드</h2>
              <p className="text-sm text-muted-foreground mt-1">
                크롤링이 처음이라면 눌러서 가이드를 펼쳐보세요.
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">펼치기 / 접기</span>
          </div>
        </summary>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {GUIDE_ITEMS.map((item) => (
            <Card key={item.title} className="overflow-hidden">
              <div className="relative w-full h-36 bg-background">
                <Image src={item.imageSrc} alt={item.imageAlt} fill className="object-contain p-4" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </details>
    </section>
  )
}
