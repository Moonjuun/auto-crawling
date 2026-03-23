---
paths:
  - "constants/**/*.ts"
  - "types/**/*.ts"
  - "store/**/*.ts"
---

# 상수·타입·스토어 규칙

## 상수 관리
- 하드코딩 문자열("로그인 하세요" 등)은 `constants/messages.ts`에 정의하라.
- 메뉴·내비게이션 목록은 `constants/menus.ts`에 정의하라.

## Zustand Store 사용 기준
- 여러 페이지에서 공유하는 상태(로그인 세션·다크모드·장바구니)에만 사용하라.
- DB에서 가져온 데이터를 단순히 보여주는 용도로 Store에 담지 마라. (React Query 또는 fetch로 충분)

## 타입 정의
- 모든 타입은 `types/` 폴더에 정의하라.
- `any` 타입 사용을 금지한다.
- Supabase 생성 타입을 우선 활용하라.
