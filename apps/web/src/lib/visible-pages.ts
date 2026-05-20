import type { ContentPage } from '../content/registry'

export function filterVisiblePages(
  pages: ReadonlyArray<ContentPage>,
  isPreview: boolean,
): Array<ContentPage> {
  if (isPreview) return [...pages]
  return pages.filter((p) => p.frontmatter.draft !== true)
}

export function findVisiblePage(
  pages: ReadonlyArray<ContentPage>,
  url: string,
  isPreview: boolean,
): ContentPage | undefined {
  const target = url.replace(/^\/+|\/+$/g, '')
  return filterVisiblePages(pages, isPreview).find((p) => p.url === target)
}
