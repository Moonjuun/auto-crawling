---
paths:
  - "app/**/*.tsx"
  - "app/**/*.ts"
  - "components/**/*.tsx"
---

# 프론트엔드 규칙

## 컴포넌트 원칙
- 기본적으로 서버 컴포넌트로 작성하라.
- useState·useEffect·onClick이 필요할 때만 파일 최상단에 `'use client'`를 추가하라.

## 디자인 시스템
- 새로운 CSS 파일과 `<style>` 태그 사용을 금지한다.
- Tailwind CSS 클래스와 Shadcn UI 컴포넌트만 사용하라.
- 색상·간격은 Shadcn 토큰(`primary`, `secondary`, `muted`)을 따르라.

## 반응형 (Mobile First)
- 모바일을 기본으로 잡고 `md:` → `lg:` 순서로 확장하라.
- 모바일: `flex-col`, 큰 화면: `flex-row`를 기본으로 하라.
- 테이블·긴 텍스트는 `overflow-x-auto` 또는 `truncate` 처리를 반드시 하라.
- 버튼·입력창은 모바일 터치 영역을 충분히 확보하라.

## 에러 처리
- 에러를 콘솔에만 찍지 마라.
- 반드시 `toast.error("...")` 또는 알림창으로 사용자에게 노출하라.
