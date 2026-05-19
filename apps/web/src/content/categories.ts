export interface Category {
  slug: string
  title: string
  description?: string
}

export const CATEGORIES: Category[] = [
  {
    slug: 'family-birth-relationships',
    title: 'Family, birth & relationships',
    description: 'Births, marriages, deaths, and family services.',
  },
]

export const CATEGORY_BY_SLUG: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
)
