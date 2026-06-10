import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router.tsx'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { DEV_MODE } from './config'
import './globals.css'

// Dev-only: lets the dev-wrapper's visual-diff overlay highlight elements
// inside this (cross-origin) iframe. Dynamically imported so it stays out of
// production bundles entirely.
if (DEV_MODE) {
  void import('./utils/devElementPicker').then(m => m.mountDevElementPicker())
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
