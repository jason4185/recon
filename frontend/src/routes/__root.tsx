import '@fontsource-variable/manrope'
import '@genlayer/transaction-kit-react/styles.css'
import '../styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { WalletProvider } from '../lib/genlayer/wallet'

const queryClient = new QueryClient()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'RECON — Work verified. Payments settled.' },
      { name: 'description', content: 'A GenLayer-powered service payment and verification platform.' },
      { name: 'theme-color', content: '#090a0d' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => <div className="grid min-h-screen place-items-center bg-[var(--bg)] text-white"><div className="text-center"><p className="text-7xl font-semibold">404</p><a href="/" className="mt-5 inline-block text-[var(--accent)]">Return to RECON</a></div></div>,
})

function RootComponent() {
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <Outlet />
          <Toaster theme="dark" position="bottom-right" richColors closeButton />
        </WalletProvider>
      </QueryClientProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
