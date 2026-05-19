export interface PageMeta {
  title: string
  description?: string
  category?: string
  category_title?: string
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
      category_title: data.category_title,
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
    const url = meta.category ? `${meta.category}/${slug}` : slug
    return { slug, url, meta, body }
  },
)

const BY_URL = new Map(PAGES.map((p) => [p.url, p]))

export function findPage(urlPath: string): ContentPage | undefined {
  return BY_URL.get(urlPath.replace(/^\/+|\/+$/g, ''))
}

export const CATEGORY_TITLES: Record<string, string> = Object.fromEntries(
  PAGES.filter((p) => p.meta.category && p.meta.category_title).map((p) => [
    p.meta.category!,
    p.meta.category_title!,
  ]),
)
