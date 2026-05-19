import { expect, test } from '@playwright/test'

test('home → category listing → content page', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: 'How you find and use government services is changing',
    }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Money and financial support' }).click()
  await expect(page).toHaveURL('/money-financial-support')
  await expect(
    page.getByRole('heading', { name: 'Money and financial support', level: 1 }),
  ).toBeVisible()

  const firstService = page
    .getByRole('link', {
      name: 'Find out how much severance payment you are owed',
    })
    .first()
  await firstService.click()

  await expect(page).toHaveURL(
    '/money-financial-support/calculate-severance-pay',
  )
  await expect(
    page.getByRole('heading', {
      name: 'Find out how much severance payment you are owed',
      level: 1,
    }),
  ).toBeVisible()
})
