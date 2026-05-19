import { expect, test } from '@playwright/test'

test('search from home leads to a result page', async ({ page }) => {
  await page.goto('/')

  const searchBox = page.getByLabel('Search for a service')
  await searchBox.fill('severance')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page).toHaveURL(/\/search-results\?q=severance/)
  await expect(
    page.getByRole('heading', { name: 'Search results' }),
  ).toBeVisible()

  const firstResult = page
    .getByRole('link', { name: /severance/i })
    .first()
  await expect(firstResult).toBeVisible()

  await firstResult.click()
  await expect(page).not.toHaveURL(/\/search-results/)
})
