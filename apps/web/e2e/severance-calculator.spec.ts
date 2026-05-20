import { expect, test } from '@playwright/test'

// The interactive calculator form does not exist in the repo yet, and the
// "Start your estimate now" anchor on the landing page is hidden by the
// rehype-hide-start-links plugin (until a research-access flag is granted).
// This spec just verifies the landing page renders. Extend once the form
// or the unhidden start link ships.
test('severance calculator landing page renders', async ({ page }) => {
  await page.goto('/money-financial-support/calculate-severance-pay')

  await expect(
    page.getByRole('heading', {
      name: 'Find out how much severance payment you are owed',
      level: 1,
    }),
  ).toBeVisible()
})
