import { test, expect } from '@playwright/test'

test('메인 페이지에서 크롤링 대시보드 주요 요소를 확인한다', async ({ page }) => {
  await page.goto('http://localhost:3000/')

  await expect(page.getByRole('heading', { name: '크롤링 대시보드' })).toBeVisible()
  await expect(page.getByRole('button', { name: '작업 관리 열기' })).toBeVisible()
  await expect(page.getByRole('button', { name: '결과 상세 보기' })).toBeVisible()
})
