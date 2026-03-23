---
paths:
  - "api/**/*.ts"
  - "app/**/actions.ts"
  - "app/**/_actions/**"
---

# 백엔드·데이터베이스 규칙

## DB 작업 전 필수
- DB 관련 코드를 작성하기 전에 반드시 현재 테이블 구조를 먼저 조회하라.
- 테이블 이름·컬럼 이름을 절대 추측해서 작성하지 마라.
- Supabase MCP가 연결된 경우 MCP 툴로 직접 조회하라.
- MCP가 없으면 사용자에게 스키마를 요청하라.

## Server Actions
- 데이터 저장·수정·삭제는 `pages/api`나 `route.ts`를 만들지 마라.
- 반드시 Server Actions(`'use server'`)로 구현하라.
- 파일 최상단에 `'use server'` 명시, `try/catch` 에러 처리 필수.

## 보안
- 모든 새 테이블에 RLS(Row Level Security) 정책을 활성화하라.
- SQL 작성 시 접근 정책(공개 조회·로그인 사용자 수정 등)을 함께 포함하라.
- 사용자 세션은 `@supabase/ssr`로 관리하라.

## 타입 안전성
- Supabase 생성 타입을 활용해 TypeScript 인터페이스를 정의하라.
- `any` 타입 사용을 금지한다.
