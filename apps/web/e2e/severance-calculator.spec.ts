import { expect, test } from '@playwright/test'

// The interactive calculator form does not exist in the repo yet. This spec
// covers the navigation that does exist today: landing page → "Start your
// estimate now" → the /start page. Extend this once the form ships.
test('severance calculator: landing page → start page', async ({ page }) => {
  await page.goto('/money-financial-support/calculate-severance-pay')

  await expect(
    page.getByRole('heading', {
      name: 'Find out how much severance payment you are owed',
      level: 1,
    }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Start your estimate now' }).click()

  await expect(page).toHaveURL(
    '/money-financial-support/calculate-severance-pay/start',
  )
  await expect(
    page.getByRole('heading', { name: 'How long does it take?' }),
  ).toBeVisible()
})
