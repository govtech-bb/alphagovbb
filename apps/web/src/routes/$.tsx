import { createFileRoute, notFound } from '@tanstack/react-router'
import { Heading, Text, linkVariants } from '@govtech-bb/react'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { HelpfulBox } from '../components/HelpfulBox'
import { MarkdownBody, MarkdownContent } from '../components/MarkdownContent'
import { MinistryPage } from '../components/MinistryPage'
import { resolveOrgPath, resolveOrgProps } from '../content/orgs'
import { PAGES, type ContentPage } from '../content/registry'
import { CATEGORY_BY_SLUG, type Category } from '../content/categories'
import { getIsPreview } from '../lib/preview'
import { filterVisiblePages, findVisiblePage } from '../lib/visible-pages'

interface CategoryListItem {
  title: string
  description?: string
  href: string
}

type LoaderData =
  | { kind: 'page'; page: ContentPage }
  | { kind: 'category'; category: Category; items: CategoryListItem[] }

export const Route = createFileRoute('/$')({
  loader: async ({ params }): Promise<LoaderData> => {
    const splat = (params._splat ?? '').replace(/^\/+|\/+$/g, '')
    const segments = splat.split('/').filter(Boolean)
    const isPreview = await getIsPreview()
    const visible = filterVisiblePages(PAGES, isPreview)

    if (segments.length === 1) {
      const cat = CATEGORY_BY_SLUG[segments[0]!]
      if (cat) {
        const items = visible
          .filter((p) => p.frontmatter.categories.includes(cat.slug))
          .map((p) => ({
            title: p.frontmatter.title,
            description: p.frontmatter.description,
            href: `/${p.url}`,
          }))
        return { kind: 'category', category: cat, items }
      }
    }

    const page = findVisiblePage(PAGES, splat, isPreview)
    if (page) return { kind: 'page', page }
    throw notFound()
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    if (loaderData.kind === 'page') {
      return {
        meta: [
          { title: loaderData.page.frontmatter.title },
          ...(loaderData.page.frontmatter.description
            ? [
                {
                  name: 'description',
                  content: loaderData.page.frontmatter.description,
                },
              ]
            : []),
        ],
      }
    }
    return { meta: [{ title: loaderData.category.title }] }
  },
  component: ContentRoute,
})

function ContentRoute() {
  const data = Route.useLoaderData()
  if (data.kind === 'page') return <PageView page={data.page} />
  return <CategoryView category={data.category} items={data.items} />
}

function PageView({ page }: { page: ContentPage }) {
  const org = resolveOrgPath(page.slug)
  if (org) {
    const props = resolveOrgProps(org.kind, org.orgSlug, {
      title: page.frontmatter.title,
      originalSource: page.frontmatter.source_url,
    })
    return <MinistryPage {...props} body={<MarkdownBody body={page.body} />} />
  }

  return (
    <Shell>
      <MarkdownContent body={page.body} frontmatter={page.frontmatter} />
    </Shell>
  )
}

function CategoryView({
  category,
  items,
}: {
  category: Category
  items: CategoryListItem[]
}) {
  const sorted = [...items].sort((a, b) => a.title.localeCompare(b.title))
  return (
    <Shell>
      <div className="space-y-4 lg:space-y-6">
        <Heading as="h1">{category.title}</Heading>
        {category.description ? (
          <Text as="p">{category.description}</Text>
        ) : null}
      </div>
      {sorted.length === 0 ? (
        <Text as="p" className="mt-6 text-mid-grey-00">
          No services yet.
        </Text>
      ) : (
        <div className="mt-6 flex flex-col">
          {sorted.map((item) => (
            <div
              key={item.href}
              className="border-grey-00 border-t-2 py-4 first:border-0 lg:py-8"
            >
              <a
                href={item.href}
                className={`${linkVariants()} text-[20px] leading-normal lg:text-3xl`}
              >
                {item.title}
              </a>
            </div>
          ))}
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container py-4 lg:py-6">
        <Breadcrumbs />
      </div>
      <div className="container pt-4 pb-8 lg:py-8">{children}</div>
      <div className="container">
        <HelpfulBox className="mb-4 lg:mb-16" />
      </div>
    </>
  )
}
