import { test, expect } from '@playwright/test'

test('메인 페이지에서 크롤링 대시보드 주요 요소를 확인한다', async ({ page }) => {
  await page.goto('http://localhost:3000/')

  await expect(page.getByRole('heading', { name: '크롤링 대시보드' })).toBeVisible()
  await expect(page.getByText('작업 상태, 최근 실행 결과, 실패 여부를 한 화면에서 확인합니다.')).toBeVisible()
  await expect(page.getByText('작업별 상태')).toBeVisible()
})
