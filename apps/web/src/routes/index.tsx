import { createFileRoute } from '@tanstack/react-router'
import {
  Heading,
  LinkButton,
  Search,
  Text,
  linkVariants,
} from '@govtech-bb/react'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Government Services | Government of Barbados' },
      {
        name: 'description',
        content:
          "Access official Barbados government services online — apply for passports, birth certificates, driver's licences, and more at alpha.gov.bb.",
      },
    ],
  }),
  component: Home,
})

function Home() {
  const handleSearch = (q: string) => {
    if (q === '') {
      window.location.href = '/services'
      return
    }
    window.location.href = `/search-results?q=${encodeURIComponent(q)}`
  }

  return (
    <>
      <section className="border-b-4 border-yellow-00 bg-yellow-100">
        <div className="container">
          <div className="space-y-4 py-8">
            <Heading as="h1">
              How you find and use government services is changing
            </Heading>
            <Text as="p">
              It will be clearer, simpler and faster for citizens to get things
              done.
            </Text>
            <LinkButton href="/tell-us" variant="primary">
              Tell us what's important
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="border-b-4 border-teal-40 bg-teal-10">
        <div className="container">
          <div className="space-y-4 py-8">
            <Heading as="h2">Alpha services</Heading>
            <Text as="p">
              These services are new. We're working on them and they are likely
              to change as we learn more.
            </Text>
            <Search
              label="Search for a service"
              buttonLabel="Search"
              onSearch={handleSearch}
            />
            <a href="/services" className={linkVariants()}>
              View all services
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
