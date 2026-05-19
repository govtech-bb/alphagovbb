import { createFileRoute, notFound } from '@tanstack/react-router'
import { MarkdownBody } from '../components/MarkdownContent'
import { MinistryPage } from '../components/MinistryPage'
import { ORG_PREFIXES, resolveOrgProps, type OrgKind } from '../content/orgs'
import { findPage, type ContentPage } from '../content/registry'

function findOrgPage(
  orgSlug: string,
): { kind: OrgKind; orgSlug: string; page: ContentPage } | null {
  for (const [prefix, kind] of ORG_PREFIXES) {
    const page = findPage(`${prefix}${orgSlug}`)
    if (page) return { kind, orgSlug, page }
  }
  return null
}

export const Route = createFileRoute('/government/organisations/$slug')({
  loader: ({ params }) => {
    const found = findOrgPage(params.slug)
    if (!found) throw notFound()
    return found
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
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
  },
  component: OrganisationDetail,
})

function OrganisationDetail() {
  const { kind, orgSlug, page } = Route.useLoaderData()
  const props = resolveOrgProps(kind, orgSlug, {
    title: page.frontmatter.title,
    originalSource: page.frontmatter.source_url,
  })
  return <MinistryPage {...props} body={<MarkdownBody body={page.body} />} />
}
