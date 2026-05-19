import { createFileRoute } from '@tanstack/react-router'
import { Heading } from '@govtech-bb/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Breadcrumbs } from '../components/Breadcrumbs'
import markdownRaw from '../content/register-a-birth.md?raw'

interface Frontmatter {
  title: string
  description?: string
}

function parseMarkdown(raw: string): { meta: Frontmatter; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: { title: '' }, body: raw }
  const [, fm, body] = match as unknown as [string, string, string]
  const meta: Record<string, string> = {}
  for (const line of fm.split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*"?([^"]*?)"?$/)
    if (m) meta[m[1]!] = m[2]!
  }
  return { meta: { title: meta.title ?? '', description: meta.description }, body }
}

const { meta, body } = parseMarkdown(markdownRaw)

export const Route = createFileRoute(
  '/family-birth-relationships/register-a-birth',
)({
  head: () => ({
    meta: [
      { title: meta.title },
      ...(meta.description
        ? [{ name: 'description', content: meta.description }]
        : []),
    ],
  }),
  component: RegisterBirthPage,
})

function RegisterBirthPage() {
  return (
    <>
      <div className="container py-4 lg:py-6">
        <Breadcrumbs />
      </div>
      <div className="container pt-4 pb-8 lg:py-8">
        <div className="mb-xm lg:grid lg:grid-cols-3 lg:gap-16">
          <div className="space-y-6 lg:col-span-2 lg:space-y-8">
            <Heading as="h1" className="break-anywhere">
              {meta.title}
            </Heading>
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
