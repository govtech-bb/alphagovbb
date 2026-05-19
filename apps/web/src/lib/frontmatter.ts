import { z } from 'zod'

export const FrontmatterSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  publish_date: z.coerce.date().optional(),
  source_url: z.url().optional(),
  stage: z.enum(['alpha']).optional(),
  featured: z.boolean().optional(),
  section: z.string().optional(),
})

export type RawFrontmatter = z.infer<typeof FrontmatterSchema>

/** Resolved frontmatter after the registry derives a title from the slug when absent. */
export type Frontmatter = Omit<RawFrontmatter, 'title'> & { title: string }

export function titleFromSlug(slug: string): string {
  const leaf = slug.split('/').pop() ?? slug
  const words = leaf.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
