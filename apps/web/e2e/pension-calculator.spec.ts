import { expect, test } from '@playwright/test'

// The interactive calculator form does not exist in the repo yet. This spec
// covers what's there today: the landing page renders with its key
// guidance. Extend this once the form ships.
test('pension calculator landing page renders', async ({ page }) => {
  await page.goto('/pensions-and-gratuities/calculate-your-pension')

  await expect(
    page.getByRole('heading', { name: 'Calculate your pension', level: 1 }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: "What you'll need" }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Start now' }),
  ).toBeVisible()
})
