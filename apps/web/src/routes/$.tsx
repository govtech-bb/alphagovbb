import { createFileRoute, notFound } from '@tanstack/react-router'
import { Heading } from '@govtech-bb/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { findPage, type ContentPage } from '../content/registry'

export const Route = createFileRoute('/$')({
  loader: ({ params }): ContentPage => {
    const splat = params._splat ?? ''
    const page = findPage(splat)
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    return {
      meta: [
        { title: loaderData.meta.title },
        ...(loaderData.meta.description
          ? [{ name: 'description', content: loaderData.meta.description }]
          : []),
      ],
    }
  },
  component: ContentRoute,
})

function ContentRoute() {
  const page = Route.useLoaderData()
  return (
    <>
      <div className="container py-4 lg:py-6">
        <Breadcrumbs />
      </div>
      <div className="container pt-4 pb-8 lg:py-8">
        <div className="mb-xm lg:grid lg:grid-cols-3 lg:gap-16">
          <div className="space-y-6 lg:col-span-2 lg:space-y-8">
            <Heading as="h1" className="break-anywhere">
              {page.meta.title}
            </Heading>
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {page.body}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
