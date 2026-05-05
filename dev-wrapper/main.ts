/// <reference types="vite/client" />

import { createMockWallet } from './mockWallet'
import { createPortalBridge, type LogKind } from './portalBridge'

type Theme = 'light' | 'dark'

interface PortalApiResponse {
    /** New field. Use this. */
    portalUrl?: string
    /** Legacy field, kept by the API for backward compat. Ignored here. */
    iframeUrl?: string
    token: string
}

const env = import.meta.env

const API_URL = env.VITE_PORTAL_API as string | undefined
const API_KEY = env.VITE_PORTAL_API_KEY as string | undefined
const DEFAULT_EXT_ID = (env.VITE_PORTAL_EXTENSION_ID as string | undefined) ?? ''
const LOCAL_PORTAL_URL = (env.VITE_PORTAL_LOCAL_URL as string | undefined) ?? ''
const DEFAULT_WALLET = (env.VITE_PORTAL_WALLET as string | undefined) ?? ''

const $ = <T extends HTMLElement>(id: string) => {
    const el = document.getElementById(id)
    if (!el) throw new Error(`Missing element: #${id}`)
    return el as T
}

const themeEl = $<HTMLSelectElement>('theme')
const walletEl = $<HTMLInputElement>('wallet')
const extensionEl = $<HTMLInputElement>('extensionId')
const refreshBtn = $<HTMLButtonElement>('refresh')
const iframeEl = $<HTMLIFrameElement>('portal')
const lastUrlEl = $<HTMLTextAreaElement>('lastUrl')
const lastTokenEl = $<HTMLPreElement>('lastToken')
const statusEl = $<HTMLParagraphElement>('status')

const STARTED_DISCONNECTED_KEY = 'bring-dev-wrapper:start-disconnected'
const startDisconnectedDefault = localStorage.getItem(STARTED_DISCONNECTED_KEY) !== '0'

extensionEl.value = DEFAULT_EXT_ID
walletEl.value = startDisconnectedDefault ? '' : DEFAULT_WALLET

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
const logEl = $<HTMLDivElement>('log')
const clearLogBtn = $<HTMLButtonElement>('clearLog')

function appendLog(kind: LogKind, label: string, payload?: unknown) {
    const entry = document.createElement('div')
    entry.className = 'entry'
    const ts = new Date().toLocaleTimeString(undefined, { hour12: false })
    const head = document.createElement('span')
    head.innerHTML = `<span class="ts">${ts}</span><span class="${kind}">${kind === 'in' ? '←' : kind === 'out' ? '→' : kind === 'err' ? '✗' : '·'} ${label}</span>`
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

const bridge = createPortalBridge({
    iframe: iframeEl,
    wallet,
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
        if (address) appendLog('info', `Mock wallet connected: ${address}`)
    },
})

// If the wrapper started with a wallet pre-filled ("start disconnected" off),
// pre-connect the mock wallet so its internal state matches the UI.
if (walletEl.value.trim()) {
    void wallet.connect(walletEl.value.trim())
}

manualConnectBtn.addEventListener('click', () => {
    void bridge.connect(walletEl.value.trim() || DEFAULT_WALLET || undefined)
})
manualAbortBtn.addEventListener('click', () => {
    bridge.abortSign()
})

walletBtn.addEventListener('click', () => {
    if (walletBtn.dataset.state === 'connected') {
        void bridge.disconnect()
    } else {
        void bridge.connect(walletEl.value.trim() || DEFAULT_WALLET || undefined)
    }
})

let isFirstLoad = true
let pendingId = 0

function setStatus(text: string, isError = false) {
    statusEl.textContent = text
    statusEl.classList.toggle('error', isError)
    if (text) appendLog(isError ? 'err' : 'info', text)
}

function decodeJwtPayload(token: string): unknown {
    try {
        const part = token.split('.')[1]
        if (!part) return token
        const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
        const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
        return JSON.parse(atob(padded))
    } catch {
        return token
    }
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
    if (!API_URL || !API_KEY) {
        setStatus('Missing VITE_PORTAL_API or VITE_PORTAL_API_KEY in .env.local', true)
        return null
    }

    const body = {
        extensionId: extensionEl.value.trim() || undefined,
        walletAddress,
        theme: themeEl.value as Theme,
    }

    const requestId = ++pendingId
    setStatus('Calling check/portal…')

    let res: Response
    try {
        res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
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
    lastTokenEl.textContent = JSON.stringify(decodeJwtPayload(token), null, 2)
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
