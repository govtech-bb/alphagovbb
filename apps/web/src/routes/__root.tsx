import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Footer } from '@govtech-bb/react'
import Header from '../components/Header'

const FOOTER_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Terms & Conditions', href: '/terms-conditions' },
  {
    label: 'Careers',
    href: 'https://job-boards.greenhouse.io/govtechbarbados',
  },
]

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Government Services | Government of Barbados' },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased text-black-00 bg-white-00">
        <Header />
        {children}
        <Footer
          links={FOOTER_LINKS}
          logoSrc="/images/coat-of-arms.png"
          logoAlt="Barbados Coat of Arms"
          copyrightText={`© ${new Date().getFullYear()} Government of Barbados`}
        />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
