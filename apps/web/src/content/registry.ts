import { CATEGORIES, CATEGORY_BY_SLUG } from './categories'

export interface PageMeta {
  title: string
  description?: string
  category?: string
}

export interface ContentPage {
  /** Relative slug derived from filename, e.g. "register-a-birth" or "register-a-birth/start". */
  slug: string
  /** Full URL path with category prefix when present. */
  url: string
  meta: PageMeta
  body: string
}

function parseFrontmatter(raw: string): { meta: PageMeta; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { meta: { title: '' }, body: raw }
  const [, fm, body] = match as unknown as [string, string, string]
  const data: Record<string, string> = {}
  for (const line of fm.split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*"?([^"]*?)"?$/)
    if (m) data[m[1]!] = m[2]!
  }
  return {
    meta: {
      title: data.title ?? '',
      description: data.description,
      category: data.category,
    },
    body,
  }
}

function slugFromPath(path: string): string {
  return path
    .replace(/^\.\//, '')
    .replace(/\/index\.md$/, '')
    .replace(/\.md$/, '')
}

const modules = import.meta.glob('./**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const PAGES: ContentPage[] = Object.entries(modules).map(
  ([path, raw]) => {
    const slug = slugFromPath(path)
    const { meta, body } = parseFrontmatter(raw)
    if (meta.category && !CATEGORY_BY_SLUG[meta.category]) {
      throw new Error(
        `Page "${slug}" references unknown category "${meta.category}". Add it to src/content/categories.ts.`,
      )
    }
    const url = meta.category ? `${meta.category}/${slug}` : slug
    return { slug, url, meta, body }
  },
)

const BY_URL = new Map(PAGES.map((p) => [p.url, p]))

export function findPage(urlPath: string): ContentPage | undefined {
  return BY_URL.get(urlPath.replace(/^\/+|\/+$/g, ''))
}

export { CATEGORIES, CATEGORY_BY_SLUG }

export function getCategoryTitle(slug: string): string | undefined {
  return CATEGORY_BY_SLUG[slug]?.title
}

export function getPageTitle(slug: string): string | undefined {
  return PAGES.find((p) => p.slug.split('/').pop() === slug)?.meta.title
}
