import { defineConfig } from 'vite'

// Dev-only wrapper that simulates a partner site embedding the Cashback
// Portal in an iframe. Runs on a different port from the portal itself so
// they can run side-by-side.
export default defineConfig({
    server: {
        port: 5174,
        host: true,
        strictPort: true,
    },
})
