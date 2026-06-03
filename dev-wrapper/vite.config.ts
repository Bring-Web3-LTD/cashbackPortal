import { defineConfig, loadEnv } from 'vite'

// Dev-only wrapper that simulates a partner site embedding the Cashback
// Portal in an iframe. Runs on a different port from the portal itself so
// they can run side-by-side.

// Dev-only middleware that resolves a Figma frame URL to a rendered PNG URL
// via the Figma REST API, so the visual-diff overlay panel can fetch an
// image straight from a Figma link. Token is read from the FIGMA_TOKEN
// env var on the server so it never reaches the browser.
const figmaImageProxy = (token: string | undefined) => ({
    name: 'figma-image-proxy',
    configureServer(server: import('vite').ViteDevServer) {
        server.middlewares.use('/__figma-image', async (req, res) => {
            const send = (status: number, body: unknown) => {
                res.statusCode = status
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(body))
            }
            try {
                if (!token) return send(500, { error: 'FIGMA_TOKEN env var is not set' })

                const url = new URL(req.url ?? '', 'http://localhost').searchParams.get('url') ?? ''
                // Match `/file/:key` or `/design/:key` plus a `node-id` query (dashes or colons).
                const fileMatch = url.match(/figma\.com\/(?:file|design|board|proto)\/([A-Za-z0-9]+)/)
                const nodeMatch = url.match(/[?&]node-id=([0-9]+[-:][0-9]+)/)
                if (!fileMatch || !nodeMatch) {
                    return send(400, { error: 'Expected a Figma URL with a node-id query param' })
                }
                const fileKey = fileMatch[1]
                const nodeId = nodeMatch[1].replace('-', ':')

                const scale = new URL(req.url ?? '', 'http://localhost').searchParams.get('scale') ?? '1'
                const figmaRes = await fetch(
                    `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=${encodeURIComponent(scale)}`,
                    { headers: { 'X-Figma-Token': token } },
                )
                if (!figmaRes.ok) {
                    return send(figmaRes.status, { error: `Figma API ${figmaRes.status}: ${await figmaRes.text()}` })
                }
                const data = (await figmaRes.json()) as { images?: Record<string, string | null>; err?: string }
                if (data.err) return send(502, { error: data.err })
                const imageUrl = data.images?.[nodeId]
                if (!imageUrl) return send(404, { error: `No image returned for node ${nodeId}` })
                return send(200, { imageUrl, fileKey, nodeId })
            } catch (err) {
                return send(500, { error: err instanceof Error ? err.message : String(err) })
            }
        })
    },
})

export default defineConfig(({ mode }) => {
    // Load all env vars from .env / .env.local (the empty prefix means we get
    // non-VITE_ vars too, which we need for the server-only FIGMA_TOKEN).
    const env = loadEnv(mode, process.cwd(), '')
    const figmaToken = env.FIGMA_TOKEN || process.env.FIGMA_TOKEN

    return {
        plugins: [figmaImageProxy(figmaToken)],
        server: {
            port: 5174,
            host: true,
            strictPort: true,
        },
    }
})
