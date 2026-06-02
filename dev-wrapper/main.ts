/// <reference types="vite/client" />

import { createMockWallet, type MockWallet } from './mockWallet'
import { createNightlyWallet } from './nightlyWallet'
import { createSolflareWallet } from './solflareWallet'
import { createYoroiWallet } from './yoroiWallet'
import { createCasperWallet } from './casperWallet'
import { createEckoWallet } from './eckoWallet'
import { createReadyWallet } from './readyWallet'
import { createPortalBridge, type LogKind } from './portalBridge'
import { mountVisualDiffOverlay } from './visualDiffOverlay'

// The visual-diff overlay is an authoring aid for pixel-comparing the page
// against a design. It's included in the hosted build too: the URL/file/drag
// loaders are pure client-side, and the Figma loader works either via the
// dev-only `/__figma-image` proxy (local, using the server FIGMA_TOKEN) or by
// a Figma token pasted into the overlay (which stays in the browser). No
// secret is ever baked into the build. VITE_VISUAL_DIFF controls whether it
// starts expanded (1/true).
mountVisualDiffOverlay({
    startExpanded: import.meta.env.VITE_VISUAL_DIFF === '1' || import.meta.env.VITE_VISUAL_DIFF === 'true',
})

type Theme = 'light' | 'dark'

interface PortalApiResponse {
    /** New field. Use this. */
    portalUrl?: string
    /** Legacy field, kept by the API for backward compat. Ignored here. */
    iframeUrl?: string
    token: string
}

const env = import.meta.env

// Shared/default API config. Used as a fallback when a provider-specific
// override isn't set.
const API_BASE = env.VITE_PORTAL_API as string | undefined
const API_KEY = env.VITE_PORTAL_API_KEY as string | undefined

// Per-provider API config keyed by the wallet-provider id (the values of the
// "Wallet provider" <select>). Each platform/partner has its own API key (and
// optionally its own API URL). Anything left unset falls back to the shared
// VITE_PORTAL_API / VITE_PORTAL_API_KEY above.
const PROVIDER_API: Record<string, { url?: string; key?: string }> = {
    mock: { url: env.VITE_PORTAL_API_MOCK, key: env.VITE_PORTAL_API_KEY_MOCK },
    nightly: { url: env.VITE_PORTAL_API_NIGHTLY, key: env.VITE_PORTAL_API_KEY_NIGHTLY },
    solflare: { url: env.VITE_PORTAL_API_SOLFLARE, key: env.VITE_PORTAL_API_KEY_SOLFLARE },
    yoroi: { url: env.VITE_PORTAL_API_YOROI, key: env.VITE_PORTAL_API_KEY_YOROI },
    casper: { url: env.VITE_PORTAL_API_CASPER, key: env.VITE_PORTAL_API_KEY_CASPER },
    ecko: { url: env.VITE_PORTAL_API_ECKO, key: env.VITE_PORTAL_API_KEY_ECKO },
    ready: { url: env.VITE_PORTAL_API_READY, key: env.VITE_PORTAL_API_KEY_READY },
}

// The API URL has the shape `https://host/<stage>/v1/extension/check/portal`.
// The `<stage>` segment is fixed at build time and is shown read-only in the UI
// for information only.
const stageOf = (url?: string): string => {
    if (!url) return ''
    try {
        return new URL(url).pathname.split('/').filter(Boolean)[0] ?? ''
    } catch {
        return ''
    }
}

const defaultStage = stageOf(API_BASE)

const apiStage = defaultStage
// Resolved against the currently selected wallet provider at call time.
const getApiUrl = (): string | undefined => PROVIDER_API[activeProvider]?.url || API_BASE
const getApiKey = (): string | undefined => PROVIDER_API[activeProvider]?.key || API_KEY

const DEFAULT_EXT_ID = (env.VITE_PORTAL_EXTENSION_ID as string | undefined) ?? ''
const LOCAL_PORTAL_URL = (env.VITE_PORTAL_LOCAL_URL as string | undefined) ?? ''
const DEFAULT_WALLET = (env.VITE_PORTAL_WALLET as string | undefined) ?? ''
const DEFAULT_THEME = ((env.VITE_PORTAL_THEME as string | undefined) ?? '').trim().toLowerCase()

const $ = <T extends HTMLElement>(id: string) => {
    const el = document.getElementById(id)
    if (!el) throw new Error(`Missing element: #${id}`)
    return el as T
}

const themeEl = $<HTMLSelectElement>('theme')
const walletEl = $<HTMLInputElement>('wallet')
const extensionEl = $<HTMLInputElement>('extensionId')
const apiStageInfoEl = $<HTMLElement>('apiStageInfo')
const refreshBtn = $<HTMLButtonElement>('refresh')
const iframeEl = $<HTMLIFrameElement>('portal')
const lastUrlEl = $<HTMLTextAreaElement>('lastUrl')
const lastTokenRawEl = $<HTMLTextAreaElement>('lastTokenRaw')
const lastTokenDecodedEl = $<HTMLDivElement>('lastTokenDecoded')
const statusEl = $<HTMLParagraphElement>('status')

const STARTED_DISCONNECTED_KEY = 'bring-dev-wrapper:start-disconnected'
const startDisconnectedDefault = localStorage.getItem(STARTED_DISCONNECTED_KEY) !== '0'

extensionEl.value = DEFAULT_EXT_ID
walletEl.value = startDisconnectedDefault ? '' : DEFAULT_WALLET
themeEl.value = DEFAULT_THEME === 'dark' || DEFAULT_THEME === 'light' ? DEFAULT_THEME : ''
apiStageInfoEl.textContent = apiStage || '(default)'

const layoutEl = $<HTMLElement>('layout')
const toggleBtn = $<HTMLButtonElement>('toggleSidebar')
const SIDEBAR_KEY = 'bring-dev-wrapper:sidebar-collapsed'
if (localStorage.getItem(SIDEBAR_KEY) === '1') layoutEl.classList.add('collapsed')
toggleBtn.addEventListener('click', () => {
    const collapsed = layoutEl.classList.toggle('collapsed')
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
})

const autoConnectEl = $<HTMLInputElement>('autoConnect')
const autoSignEl = $<HTMLInputElement>('autoSign')
const startDisconnectedEl = $<HTMLInputElement>('startDisconnected')
startDisconnectedEl.checked = startDisconnectedDefault
startDisconnectedEl.addEventListener('change', () => {
    localStorage.setItem(STARTED_DISCONNECTED_KEY, startDisconnectedEl.checked ? '1' : '0')
})
const manualConnectBtn = $<HTMLButtonElement>('manualConnect')
const manualAbortBtn = $<HTMLButtonElement>('manualAbort')
const walletBtn = $<HTMLButtonElement>('walletBtn')
const walletProviderEl = $<HTMLSelectElement>('walletProvider')
const logEl = $<HTMLDivElement>('log')
const clearLogBtn = $<HTMLButtonElement>('clearLog')

// "Log out" clears the CloudFront HTTP basic-auth credentials the browser has
// cached for this origin. It only makes sense on the hosted build (the local
// dev server isn't password-protected), so the button stays hidden on
// localhost / 127.0.0.1.
const logoutBtn = $<HTMLButtonElement>('logoutBtn')
const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(location.hostname)
if (!isLocalHost) {
    logoutBtn.hidden = false
    logoutBtn.addEventListener('click', () => {
        // Overwrite the stored Basic-Auth credentials with bogus ones so the
        // browser drops the cached pair for this realm, then reload to force a
        // fresh 401 / credentials prompt.
        try {
            const xhr = new XMLHttpRequest()
            xhr.open('GET', location.href, true, 'logout', String(Date.now()))
            xhr.onloadend = () => location.reload()
            xhr.send()
        } catch {
            location.reload()
        }
    })
}

function appendLog(kind: LogKind, label: string, payload?: unknown) {
    const entry = document.createElement('div')
    entry.className = 'entry'
    const ts = new Date().toLocaleTimeString(undefined, { hour12: false })
    const head = document.createElement('span')
    const tsSpan = document.createElement('span')
    tsSpan.className = 'ts'
    tsSpan.textContent = ts
    const labelSpan = document.createElement('span')
    labelSpan.className = kind
    const direction = kind === 'in' ? '←' : kind === 'out' ? '→' : kind === 'err' ? '✗' : '·'
    labelSpan.textContent = `${direction} ${label}`
    head.appendChild(tsSpan)
    head.appendChild(labelSpan)
    entry.appendChild(head)
    if (payload !== undefined) {
        const pre = document.createElement('div')
        const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
        pre.textContent = text
        entry.appendChild(pre)
    }
    logEl.appendChild(entry)
    logEl.scrollTop = logEl.scrollHeight
}

clearLogBtn.addEventListener('click', () => {
    logEl.innerHTML = ''
})

const shortAddress = (addr: string) =>
    addr.length > 10 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr

function setWalletButton(address: string | null) {
    if (address) {
        walletBtn.dataset.state = 'connected'
        walletBtn.textContent = shortAddress(address)
        walletBtn.title = `${address} — click to disconnect`
    } else {
        walletBtn.dataset.state = 'disconnected'
        walletBtn.textContent = 'Connect wallet'
        walletBtn.title = 'Click to connect mock wallet'
    }
}

setWalletButton(walletEl.value.trim() || null)

walletEl.addEventListener('input', () => {
    setWalletButton(walletEl.value.trim() || null)
})

const wallet = createMockWallet({
    getPreferredAddress: () => walletEl.value.trim() || DEFAULT_WALLET,
})

// `wallet` above is the in-page mock. The bridge always talks to a single
// `MockWallet` reference, so we wrap a proxy that forwards to whichever
// adapter the user picks in the sidebar (mock | nightly | ...).
type WalletProviderId = 'mock' | 'nightly' | 'solflare' | 'yoroi' | 'casper' | 'ecko' | 'ready'
const WALLET_PROVIDER_KEY = 'bring-dev-wrapper:wallet-provider'

const mockAdapter = wallet
let nightlyAdapter: MockWallet | null = null
const getNightlyAdapter = (): MockWallet => {
    if (!nightlyAdapter) {
        nightlyAdapter = createNightlyWallet({
            onSign: ({ key }) => appendLog('info', `Nightly signed with ${shortAddress(key)}`),
        })
    }
    return nightlyAdapter
}
let solflareAdapter: MockWallet | null = null
const getSolflareAdapter = (): MockWallet => {
    if (!solflareAdapter) {
        solflareAdapter = createSolflareWallet({
            onSign: ({ key }) => appendLog('info', `Solflare signed with ${shortAddress(key)}`),
        })
    }
    return solflareAdapter
}
let yoroiAdapter: MockWallet | null = null
const getYoroiAdapter = (): MockWallet => {
    if (!yoroiAdapter) {
        yoroiAdapter = createYoroiWallet({
            onSign: ({ key }) => appendLog('info', `Yoroi signed with ${shortAddress(key)}`),
        })
    }
    return yoroiAdapter
}
let casperAdapter: MockWallet | null = null
const getCasperAdapter = (): MockWallet => {
    if (!casperAdapter) {
        casperAdapter = createCasperWallet({
            onSign: ({ key }) => appendLog('info', `Casper signed with ${shortAddress(key)}`),
        })
    }
    return casperAdapter
}
let eckoAdapter: MockWallet | null = null
const getEckoAdapter = (): MockWallet => {
    if (!eckoAdapter) eckoAdapter = createEckoWallet()
    return eckoAdapter
}
let readyAdapter: MockWallet | null = null
const getReadyAdapter = (): MockWallet => {
    if (!readyAdapter) readyAdapter = createReadyWallet()
    return readyAdapter
}

const initialProvider = (localStorage.getItem(WALLET_PROVIDER_KEY) as WalletProviderId | null) ?? 'mock'
walletProviderEl.value = initialProvider
let activeProvider: WalletProviderId = initialProvider
// Now that the active provider is known, show its API stage.
apiStageInfoEl.textContent = stageOf(getApiUrl()) || '(default)'

const pickAdapter = (): MockWallet => {
    switch (activeProvider) {
        case 'nightly': return getNightlyAdapter()
        case 'solflare': return getSolflareAdapter()
        case 'yoroi': return getYoroiAdapter()
        case 'casper': return getCasperAdapter()
        case 'ecko': return getEckoAdapter()
        case 'ready': return getReadyAdapter()
        default: return mockAdapter
    }
}

const walletProxy: MockWallet = {
    getAddress: () => pickAdapter().getAddress(),
    connect: (override) => pickAdapter().connect(override),
    signMessage: (msg) => pickAdapter().signMessage(msg),
    disconnect: () => pickAdapter().disconnect(),
}

const applyProviderUi = () => {
    const isExternal = activeProvider !== 'mock'
    // External wallets supply their own address; the input becomes a display.
    walletEl.readOnly = isExternal
    walletEl.placeholder = isExternal
        ? '(provided by extension)'
        : '0x… (leave empty for null)'
    walletBtn.title = isExternal
        ? 'Click to connect via the selected wallet extension'
        : (walletBtn.dataset.state === 'connected'
            ? `${walletEl.value} — click to disconnect`
            : 'Click to connect mock wallet')
}
applyProviderUi()

walletProviderEl.addEventListener('change', async () => {
    const next = walletProviderEl.value as WalletProviderId
    if (next === activeProvider) return
    // Disconnect the current adapter cleanly so its internal state matches the UI.
    try { await bridge.disconnect() } catch { /* ignore */ }
    activeProvider = next
    localStorage.setItem(WALLET_PROVIDER_KEY, activeProvider)
    appendLog('info', `Wallet provider → ${activeProvider}`)
    applyProviderUi()
    // Switching provider = new platform/API key = brand-new portal session:
    // reflect the (possibly different) stage and force a full iframe reload.
    apiStageInfoEl.textContent = stageOf(getApiUrl()) || '(default)'
    isFirstLoad = true
    void refresh()
})

const bridge = createPortalBridge({
    iframe: iframeEl,
    wallet: walletProxy,
    log: appendLog,
    shouldAutoConnect: () => autoConnectEl.checked,
    shouldAutoSign: () => autoSignEl.checked,
    refreshToken: async (address) => {
        const data = await bootstrap(address)
        return data?.token ?? null
    },
    onAddressChange: (address) => {
        walletEl.value = address ?? ''
        setWalletButton(address)
        if (address) appendLog('info', `${activeProvider === 'mock' ? 'Mock' : activeProvider} wallet connected: ${address}`)
    },
})

// If the wrapper started with a wallet pre-filled ("start disconnected" off)
// AND the mock provider is active, pre-connect the mock wallet so its
// internal state matches the UI. External providers (e.g. nightly) drive
// the address themselves on connect, so we never auto-poke them here.
if (activeProvider === 'mock' && walletEl.value.trim()) {
    void mockAdapter.connect(walletEl.value.trim())
}

manualConnectBtn.addEventListener('click', () => {
    // For external wallets we never pass an override — the extension owns the key.
    const override = activeProvider === 'mock'
        ? (walletEl.value.trim() || DEFAULT_WALLET || undefined)
        : undefined
    void bridge.connect(override)
})
manualAbortBtn.addEventListener('click', () => {
    bridge.abortSign()
})

walletBtn.addEventListener('click', () => {
    if (walletBtn.dataset.state === 'connected') {
        void bridge.disconnect()
    } else {
        const override = activeProvider === 'mock'
            ? (walletEl.value.trim() || DEFAULT_WALLET || undefined)
            : undefined
        void bridge.connect(override)
    }
})

let isFirstLoad = true
let pendingId = 0

function setStatus(text: string, isError = false) {
    statusEl.textContent = text
    statusEl.classList.toggle('error', isError)
    if (text) appendLog(isError ? 'err' : 'info', text)
}

function decodeJwtSegment(seg: string): unknown {
    const b64 = seg.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    return JSON.parse(atob(padded))
}

interface DecodedJwt {
    header: unknown
    payload: Record<string, unknown>
    signature: string
}

function decodeJwt(token: string): DecodedJwt | null {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    try {
        return {
            header: decodeJwtSegment(parts[0]),
            payload: decodeJwtSegment(parts[1]) as Record<string, unknown>,
            signature: parts[2],
        }
    } catch {
        return null
    }
}

function formatTimestamp(value: unknown): string | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    const date = new Date(value * 1000)
    if (Number.isNaN(date.getTime())) return null
    const delta = value * 1000 - Date.now()
    const abs = Math.abs(delta)
    const seconds = Math.round(abs / 1000)
    const rel =
        seconds < 60 ? `${seconds}s`
        : seconds < 3600 ? `${Math.round(seconds / 60)}m`
        : seconds < 86400 ? `${Math.round(seconds / 3600)}h`
        : `${Math.round(seconds / 86400)}d`
    return `${date.toLocaleString()} (${delta >= 0 ? 'in ' : ''}${rel}${delta >= 0 ? '' : ' ago'})`
}

function renderDecodedJwt(token: string) {
    lastTokenRawEl.value = token
    lastTokenDecodedEl.innerHTML = ''

    const decoded = decodeJwt(token)
    if (!decoded) {
        const p = document.createElement('p')
        p.className = 'hint error'
        p.textContent = 'Token is not a valid JWT (expected three dot-separated segments).'
        lastTokenDecodedEl.appendChild(p)
        return
    }

    const section = (title: string, body: HTMLElement) => {
        const wrap = document.createElement('div')
        wrap.className = 'jwt-section'
        const h = document.createElement('h4')
        h.textContent = title
        wrap.appendChild(h)
        wrap.appendChild(body)
        lastTokenDecodedEl.appendChild(wrap)
    }

    const pre = (value: unknown) => {
        const el = document.createElement('pre')
        el.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
        return el
    }

    section('Header', pre(decoded.header))

    section('Payload', pre(decoded.payload))

    const claimsTable = document.createElement('table')
    claimsTable.className = 'jwt-claims'
    const tsClaims: Array<[string, string]> = [
        ['iat', 'Issued at'],
        ['exp', 'Expires at'],
        ['nbf', 'Not before'],
    ]
    let hasRows = false
    for (const [key, label] of tsClaims) {
        const formatted = formatTimestamp(decoded.payload[key])
        if (!formatted) continue
        hasRows = true
        const row = document.createElement('tr')
        const th = document.createElement('th')
        th.textContent = `${label} (${key})`
        const td = document.createElement('td')
        td.textContent = formatted
        row.appendChild(th)
        row.appendChild(td)
        claimsTable.appendChild(row)
    }
    if (hasRows) section('Timestamps', claimsTable)

    section('Signature', pre(decoded.signature))
}

function buildIframeSrc(returnedUrl: string, token: string): string {
    const base = (() => {
        if (!LOCAL_PORTAL_URL) return returnedUrl
        try {
            const remote = new URL(returnedUrl)
            const local = new URL(LOCAL_PORTAL_URL)
            local.search = remote.search
            local.pathname = remote.pathname === '/' ? local.pathname : remote.pathname
            return local.toString()
        } catch {
            return returnedUrl
        }
    })()
    try {
        const u = new URL(base)
        if (!u.searchParams.get('token')) u.searchParams.set('token', token)
        return u.toString()
    } catch {
        return base
    }
}

async function bootstrap(walletAddress: string | null): Promise<PortalApiResponse | null> {
    const apiUrl = getApiUrl()
    const apiKey = getApiKey()
    if (!apiUrl || !apiKey) {
        setStatus(`Missing API URL or key for provider "${activeProvider}" (set VITE_PORTAL_API / VITE_PORTAL_API_KEY, or the per-provider overrides VITE_PORTAL_API_<PROVIDER> / VITE_PORTAL_API_KEY_<PROVIDER>, in .env.local)`, true)
        return null
    }

    const body = {
        extensionId: extensionEl.value.trim() || undefined,
        walletAddress,
        // Empty string means "don't include theme in the payload" so the
        // portal/API uses its own defaults.
        theme: (themeEl.value || undefined) as Theme | undefined,
    }

    const requestId = ++pendingId
    setStatus('Calling check/portal…')

    let res: Response
    try {
        res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })
    } catch (err) {
        if (requestId !== pendingId) return null
        setStatus(`Network error: ${(err as Error).message}`, true)
        return null
    }

    if (requestId !== pendingId) return null

    if (!res.ok) {
        setStatus(`HTTP ${res.status} ${res.statusText}`, true)
        return null
    }

    let data: PortalApiResponse
    try {
        data = (await res.json()) as PortalApiResponse
    } catch (err) {
        setStatus(`Invalid JSON: ${(err as Error).message}`, true)
        return null
    }

    const { portalUrl, token } = data
    if (!portalUrl || !token) {
        setStatus('Response is missing portalUrl or token', true)
        return null
    }

    lastUrlEl.value = portalUrl
    renderDecodedJwt(token)
    return data
}

async function refresh() {
    const walletValue = walletEl.value.trim()
    const data = await bootstrap(walletValue === '' ? null : walletValue)
    if (!data) return
    const { portalUrl, token } = data

    if (isFirstLoad) {
        // First load: token is embedded in portalUrl's query string.
        iframeEl.src = buildIframeSrc(portalUrl!, token)
        isFirstLoad = false
        setStatus('Loaded.')
    } else {
        // Subsequent updates (theme / extensionId): push fresh token via
        // SESSION_UPDATE — the same message used for wallet changes.
        try {
            const targetOrigin = new URL(iframeEl.src).origin
            iframeEl.contentWindow?.postMessage(
                { to: 'bringweb3', action: 'SESSION_UPDATE', token },
                targetOrigin,
            )
            setStatus('Posted refreshed token to iframe.')
        } catch (err) {
            setStatus(`postMessage failed: ${(err as Error).message}`, true)
        }
    }
}

themeEl.addEventListener('change', refresh)
extensionEl.addEventListener('change', refresh)
refreshBtn.addEventListener('click', refresh)

// Wallet input edits go through the bridge so the mock wallet's internal state
// stays in sync and the same SESSION_UPDATE flow is used.
walletEl.addEventListener('change', () => {
    const v = walletEl.value.trim()
    if (v) void bridge.connect(v)
    else void bridge.disconnect()
})

refresh()
