import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
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

const aws = async <T>(...args: string[]): Promise<T> => {
    const { stdout } = await promisify(execFile)('aws', [
        ...args, '--output', 'json',
    ], { timeout: 15000, maxBuffer: 10 * 1024 * 1024 })
    return JSON.parse(stdout) as T
}
// DELETE_FAILED / ROLLBACK_COMPLETE stacks leave a dead mapping behind
const LIVE_STACK = /^(CREATE|UPDATE|UPDATE_ROLLBACK|IMPORT)_COMPLETE$/

// envName suggestions: base paths on api.bringweb3.io whose `{stage}-stack` is live,
// via the dev's own AWS CLI credentials
const envNamesList = () => ({
    name: 'env-names',
    configureServer(server: import('vite').ViteDevServer) {
        server.middlewares.use('/__env-names', async (_req, res) => {
            res.setHeader('Content-Type', 'application/json')
            try {
                const [mappings, stacks] = await Promise.all([
                    aws<[string, string][]>('apigateway', 'get-base-path-mappings', '--domain-name', 'api.bringweb3.io',
                        '--query', 'items[].[basePath,stage]'),
                    aws<[string, string][]>('cloudformation', 'describe-stacks', '--query', 'Stacks[].[StackName,StackStatus]'),
                ])
                const live = new Set(stacks.filter(([, status]) => LIVE_STACK.test(status)).map(([name]) => name))
                const names = mappings
                    .filter(([, stage]) => live.has(`${stage}-stack`))
                    .map(([basePath]) => basePath)
                    .sort((a, b) => a.localeCompare(b))
                res.end(JSON.stringify(names))
            } catch (err) {
                // execFile's message is just the command; the AWS reason is on stderr.
                // Terminal only: stderr can carry the account id / IAM ARN
                const error = (err as { stderr?: string }).stderr?.trim() || (err instanceof Error ? err.message : String(err))
                server.config.logger.warn(`[env-names] envName list unavailable (AWS CLI / credentials?): ${error}`)
                res.statusCode = 502
                res.end(JSON.stringify({ error: 'env list unavailable' }))
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
        plugins: [figmaImageProxy(figmaToken), envNamesList()],
        server: {
            port: 5174,
            host: true,
            strictPort: true,
        },
    }
})
