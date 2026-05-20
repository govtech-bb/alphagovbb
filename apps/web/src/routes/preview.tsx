import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { enterPreview, exitPreview } from '../lib/preview'

const PreviewSearch = z.object({
  token: z.string().optional(),
  exit: z.string().optional(),
})

export const Route = createFileRoute('/preview')({
  validateSearch: PreviewSearch,
  loaderDeps: ({ search }) => ({ token: search.token, exit: search.exit }),
  loader: async ({ deps }) => {
    if (deps.exit) {
      await exitPreview()
      throw redirect({ to: '/' })
    }
    const result = await enterPreview({ data: { token: deps.token ?? '' } })
    if (!result.ok) {
      throw notFound()
    }
    throw redirect({ to: '/' })
  },
  component: () => null,
})
