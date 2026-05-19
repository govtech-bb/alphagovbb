import { createFileRoute } from '@tanstack/react-router'
import { Heading, Text, linkVariants } from '@govtech-bb/react'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { search } from '../lib/search'
import { z } from 'zod'

const Search = z.object({
  q: z.string().optional().default(''),
})

export const Route = createFileRoute('/search-results')({
  validateSearch: Search,
  head: () => ({
    meta: [{ title: 'Search | Government of Barbados' }],
  }),
  component: SearchResultsPage,
})

function SearchResultsPage() {
  const { q } = Route.useSearch()
  const hits = q ? search(q) : []

  return (
    <>
      <div className="container py-4 lg:py-6">
        <Breadcrumbs />
      </div>
      <div className="container pt-4 pb-8 lg:py-8">
        <div className="space-y-4 lg:space-y-6">
          <Heading as="h1">
            {q ? `Results for “${q}”` : 'Search'}
          </Heading>
          <Text as="p" className="text-mid-grey-00">
            {q
              ? `${hits.length} ${hits.length === 1 ? 'result' : 'results'}`
              : 'Enter a search above to find a service.'}
          </Text>
        </div>

        {q && hits.length === 0 ? (
          <Text as="p" className="mt-6">
            No matches. Try different keywords or browse the categories on the
            homepage.
          </Text>
        ) : null}

        {hits.length > 0 ? (
          <div className="mt-6 flex flex-col">
            {hits.map((hit) => (
              <div
                key={hit.id}
                className="border-grey-00 border-t-2 py-4 first:border-0 lg:py-8"
              >
                <a
                  href={hit.href}
                  className={`${linkVariants()} cursor-pointer text-[20px] leading-normal lg:text-3xl`}
                >
                  {hit.title}
                </a>
                <Text as="p" className="mt-1 text-mid-grey-00">
                  {hit.category}
                </Text>
                {hit.description ? (
                  <Text as="p" className="mt-1">
                    {hit.description}
                  </Text>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  )
}
