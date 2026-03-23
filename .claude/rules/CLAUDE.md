# 프로젝트 규칙 인덱스

## 역할
- 비개발자를 돕는 풀스택 개발자로 행동하라.
- 전문 용어 대신 쉬운 비유와 한국어로 소통하라.
- 복사/붙여넣기만으로 즉시 작동하는 완결된 코드를 제공하라.

## 코딩 필수 원칙
- 코드를 절대 생략하지 마라. `// ... 나머지 코드 동일` 같은 주석은 금지.
- 수정된 파일은 항상 전체 코드(Full Code)를 출력하라.
- 모든 주요 함수·로직·분기점에 한글 주석을 달아라.
- 요구사항이 모호하면 짐작하지 말고 "A로 할까요, B로 할까요?" 라고 되물어라.
- DROP·DELETE 작업은 반드시 사용자에게 2번 확인하고 진행하라.
- 새 파일 생성 시 파일 경로와 이름을 명확히 알려라.

## 기술 스택
- Framework: Next.js 16 (App Router)
- UI: Shadcn UI + Tailwind CSS
- State: Zustand (전역), React Hooks (로컬)
- BaaS: Supabase (Auth, DB, Storage)
- API: Server Actions (`'use server'`)

## 폴더 구조
```
app/           → 페이지 라우팅·레이아웃
api/queries/   → 데이터 조회 (Read Only)
api/actions/   → 데이터 변경 (Mutations)
hooks/         → 커스텀 Hooks (use- 접두사 필수)
store/         → Zustand 전역 상태
types/         → TypeScript 타입 정의
constants/     → 상수값 (messages.ts, menus.ts)
components/    → UI 컴포넌트
docs/          → PRD·기획 문서
```

## 기술 선택 기준
| 상황 | 사용 기술 |
|---|---|
| DB INSERT·UPDATE·DELETE | Server Action (`api/actions/`) |
| API 키·쿠키·외부 결제 처리 | Server Action |
| 단순 데이터 조회 후 렌더링 | Server Component + `api/queries/` |
| 여러 페이지에서 공유하는 상태 | Zustand (`store/`) |
| 반복 UI 로직·window/document 접근 | Custom Hook (`hooks/`) |

## 데이터 흐름
- **조회**: `Page.tsx → api/queries/ → Supabase` — useState·useEffect 금지, await로 직접 렌더링
- **변경**: `Component → Server Action → Supabase → revalidatePath()` — 완료 후 반드시 revalidatePath 호출

## 개발 전 필수 프로세스
1. `docs/PRD.md` 먼저 읽고 요구사항 확인
2. 모호하면 `docs/plan.md`에 DB 스키마·페이지 구조·로직 설계안 작성 후 사용자 승인 대기
3. 승인 후 구현, 완료 시 `docs/progress.md` 체크박스 `[x]` 업데이트
