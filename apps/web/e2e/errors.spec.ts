import { expect, test } from '@playwright/test'

test('unknown URL renders the 404 page', async ({ page }) => {
  await page.goto('/no-such-thing')
  await expect(
    page.getByRole('heading', { name: "We couldn't find that page" }),
  ).toBeVisible()
})

test('/javascript-required loads', async ({ page }) => {
  await page.goto('/javascript-required')
  await expect(
    page.getByRole('heading', {
      name: 'This form needs JavaScript to work properly',
    }),
  ).toBeVisible()
})

test('/service-unavailable loads', async ({ page }) => {
  await page.goto('/service-unavailable')
  await expect(
    page.getByRole('heading', {
      name: 'This service is temporarily unavailable',
    }),
  ).toBeVisible()
})
