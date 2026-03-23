---
paths:
  - "docs/**/*.md"
  - "README.md"
  - ".env.example"
---

# 문서화 규칙

## README.md 업데이트
새로운 주요 기능 추가 시 반드시 `README.md`에 기록하라.
- 기능: `- [x] 기능명 (YYYY.MM.DD)`
- 새 페이지: `페이지명: /경로`

## 환경변수 관리
- `.env.example`에 변수명만 남기고 실제 값은 비워라.
- 발급처 주석을 반드시 추가하라.
  - 예: `# Supabase 대시보드 > Project Settings > API에서 복사`

## 비즈니스 로직 기록
코드만 봐서는 알 수 없는 정책·권한 결정은 `docs/logic.md`에 기록하라.

## 트러블슈팅
자주 발생하는 에러와 해결 방법은 `docs/troubleshooting.md`에 기록하라.

## 기획 변경 시
코드를 수정하기 전에 반드시 `docs/PRD.md`를 먼저 수정하라.
