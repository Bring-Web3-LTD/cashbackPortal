/// <reference types="vite/client" />

import { createMockWallet, type MockWallet } from './mockWallet'
import { createNightlyWallet } from './nightlyWallet'
import { createSolflareWallet } from './solflareWallet'
import { createYoroiWallet } from './yoroiWallet'
import { createGeroWallet } from './geroWallet'
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
    gero: { url: env.VITE_PORTAL_API_GERO, key: env.VITE_PORTAL_API_KEY_GERO },
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
const DEFAULT_VIEW_MODE = ((env.VITE_PORTAL_VIEW_MODE as string | undefined) ?? '').trim().toLowerCase()

const $ = <T extends HTMLElement>(id: string) => {
    const el = document.getElementById(id)
    if (!el) throw new Error(`Missing element: #${id}`)
    return el as T
}

const themeEl = $<HTMLSelectElement>('theme')
const walletEl = $<HTMLInputElement>('wallet')
const extensionEl = $<HTMLInputElement>('extensionId')
const walletNameEl = $<HTMLInputElement>('walletName')
const walletEmojiEl = $<HTMLInputElement>('walletEmoji')
const apiStageInfoEl = $<HTMLElement>('apiStageInfo')
const refreshBtn = $<HTMLButtonElement>('refresh')
const iframeEl = $<HTMLIFrameElement>('portal')
const frameEl = $<HTMLElement>('frame')
const viewModeEl = $<HTMLSelectElement>('viewMode')
const styleAsEl = $<HTMLSelectElement>('styleAs')
const lastUrlEl = $<HTMLTextAreaElement>('lastUrl')
const lastTokenRawEl = $<HTMLTextAreaElement>('lastTokenRaw')
const lastTokenDecodedEl = $<HTMLDivElement>('lastTokenDecoded')
const statusEl = $<HTMLParagraphElement>('status')

const START_CONNECTED_KEY = 'bring-dev-wrapper:start-connected'
const startConnected = localStorage.getItem(START_CONNECTED_KEY) === '1'

extensionEl.value = DEFAULT_EXT_ID
// Wallet starts empty; if "Start connected" is on and the provider is mock, we
// pre-fill the default address below (once the active provider is known) so the
// first bootstrap logs the portal in.
walletEl.value = ''
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

// View-mode switcher: Desktop (full width), Mobile (constrained iframe width
// so the portal's `window.innerWidth <= MOBILE_PORTAL_MAX_WIDTH` check fires
// and renders the mobile portal), or Responsive (exact user-set px dimensions).
// The portal only reads innerWidth at bootstrap, so changing modes reloads the
// iframe.
const VIEW_MODE_KEY = 'bring-dev-wrapper:view-mode'
const RESPONSIVE_SIZE_KEY = 'bring-dev-wrapper:responsive-size'
const responsiveWidthEl = $<HTMLInputElement>('responsiveWidth')
const responsiveHeightEl = $<HTMLInputElement>('responsiveHeight')

const savedSize = (() => {
    try {
        const parsed = JSON.parse(localStorage.getItem(RESPONSIVE_SIZE_KEY) || '')
        if (Number.isFinite(parsed?.w) && Number.isFinite(parsed?.h)) return parsed as { w: number; h: number }
    } catch { /* fall through to defaults */ }
    return { w: 1024, h: 768 }
})()
responsiveWidthEl.value = String(savedSize.w)
responsiveHeightEl.value = String(savedSize.h)

const applyResponsiveSize = () => {
    frameEl.style.setProperty('--responsive-w', `${savedSize.w}px`)
    frameEl.style.setProperty('--responsive-h', `${savedSize.h}px`)
}
applyResponsiveSize()

// Device presets (CSS viewport sizes, portrait) for the Mobile/Responsive
// modes, mirroring browser devtools device emulation. In Mobile mode a preset
// sizes the stage to the exact device viewport; in Responsive mode it drives
// the width/height inputs, so drag-resize and manual edits still work (and
// drop the selection back to "Custom"). Orientation is a separate flag so
// rotate survives switching devices.
type DevicePlatform = 'ios' | 'android'
const DEVICES: { key: string; label: string; w: number; h: number; group: string; platform: DevicePlatform }[] = [
    { key: 'iphone-se', label: 'iPhone SE', w: 375, h: 667, group: 'Phones', platform: 'ios' },
    { key: 'iphone-14', label: 'iPhone 14', w: 390, h: 844, group: 'Phones', platform: 'ios' },
    { key: 'iphone-16', label: 'iPhone 15 / 16', w: 393, h: 852, group: 'Phones', platform: 'ios' },
    { key: 'iphone-17', label: 'iPhone 17', w: 402, h: 874, group: 'Phones', platform: 'ios' },
    { key: 'iphone-17-pro-max', label: 'iPhone 17 Pro Max', w: 440, h: 956, group: 'Phones', platform: 'ios' },
    { key: 'pixel-7', label: 'Pixel 7', w: 412, h: 915, group: 'Phones', platform: 'android' },
    { key: 'galaxy-s8-plus', label: 'Galaxy S8+', w: 360, h: 740, group: 'Phones', platform: 'android' },
    { key: 'galaxy-s20-ultra', label: 'Galaxy S20 Ultra', w: 412, h: 915, group: 'Phones', platform: 'android' },
    { key: 'galaxy-z-fold', label: 'Galaxy Z Fold (folded)', w: 344, h: 882, group: 'Phones', platform: 'android' },
    { key: 'ipad-mini', label: 'iPad Mini', w: 768, h: 1024, group: 'Tablets', platform: 'ios' },
    { key: 'ipad-air', label: 'iPad Air', w: 820, h: 1180, group: 'Tablets', platform: 'ios' },
    { key: 'ipad-pro-11', label: 'iPad Pro 11″', w: 834, h: 1194, group: 'Tablets', platform: 'ios' },
    { key: 'ipad-pro-129', label: 'iPad Pro 12.9″', w: 1024, h: 1366, group: 'Tablets', platform: 'ios' },
]
const DEVICE_KEY = 'bring-dev-wrapper:device'
const DEVICE_LANDSCAPE_KEY = 'bring-dev-wrapper:device-landscape'
const deviceEl = $<HTMLSelectElement>('devicePreset')
const rotateBtn = $<HTMLButtonElement>('rotateDevice')

{
    const custom = document.createElement('option')
    custom.value = ''
    custom.textContent = 'Custom / default'
    deviceEl.append(custom)
    const groups = new Map<string, HTMLOptGroupElement>()
    for (const device of DEVICES) {
        let group = groups.get(device.group)
        if (!group) {
            group = document.createElement('optgroup')
            group.label = device.group
            groups.set(device.group, group)
            deviceEl.append(group)
        }
        const option = document.createElement('option')
        option.value = device.key
        option.textContent = `${device.label} (${device.w}×${device.h})`
        group.append(option)
    }
}

let deviceLandscape = localStorage.getItem(DEVICE_LANDSCAPE_KEY) === '1'
const savedDevice = localStorage.getItem(DEVICE_KEY) || ''
deviceEl.value = DEVICES.some(d => d.key === savedDevice) ? savedDevice : ''

const applyDevice = (mode: string) => {
    // Toolbar controls stay visible in every mode and gray out when inactive,
    // so the header doesn't reflow as the mode changes.
    const framed = mode === 'mobile' || mode === 'responsive'
    deviceEl.disabled = !framed
    const device = DEVICES.find(d => d.key === deviceEl.value)
    // In Mobile mode with no device there's nothing to rotate (fixed 360px
    // column); in Responsive mode rotate always works (swaps custom size too).
    rotateBtn.disabled = !framed || (!device && mode === 'mobile')
    frameEl.classList.toggle('has-device', Boolean(device) && mode === 'mobile')
    if (!device) return
    const w = deviceLandscape ? device.h : device.w
    const h = deviceLandscape ? device.w : device.h
    if (mode === 'mobile') {
        frameEl.style.setProperty('--device-w', `${w}px`)
        frameEl.style.setProperty('--device-h', `${h}px`)
    } else if (mode === 'responsive') {
        savedSize.w = w
        savedSize.h = h
        responsiveWidthEl.value = String(w)
        responsiveHeightEl.value = String(h)
        applyResponsiveSize()
        localStorage.setItem(RESPONSIVE_SIZE_KEY, JSON.stringify(savedSize))
    }
}

// Platform hint sent in the check/portal body so the backend can bake the
// coupon partner's `platform` param into couponsIframeSrc (explicit platform
// instead of UA sniffing, which sees the desktop browser). Derived from the
// device preset; plain Mobile mode defaults to ios, Desktop/custom-Responsive
// send nothing. Harmlessly ignored until the backend supports the field.
const getDevicePlatform = (): DevicePlatform | undefined => {
    const device = DEVICES.find(d => d.key === deviceEl.value)
    if (viewModeEl.value === 'mobile') return device?.platform ?? 'ios'
    if (viewModeEl.value === 'responsive') return device?.platform
    return undefined
}

// Manual size edits / drag-resize mean the size no longer matches the preset.
const clearDeviceSelection = () => {
    if (!deviceEl.value) return
    deviceEl.value = ''
    localStorage.setItem(DEVICE_KEY, '')
    applyDevice(viewModeEl.value)
}

deviceEl.addEventListener('change', () => {
    // Drop focus once picked, so the toolbar doesn't keep a focus ring and
    // stray arrow keys can't re-trigger a device change.
    deviceEl.blur()
    localStorage.setItem(DEVICE_KEY, deviceEl.value)
    applyDevice(viewModeEl.value)
    // Re-bootstrap so the portal re-evaluates useMobilePortal at the new width.
    void refresh()
})

rotateBtn.addEventListener('click', () => {
    if (!deviceEl.value && viewModeEl.value === 'responsive') {
        // Custom size: rotate just swaps the current width/height.
        ;[savedSize.w, savedSize.h] = [savedSize.h, savedSize.w]
        responsiveWidthEl.value = String(savedSize.w)
        responsiveHeightEl.value = String(savedSize.h)
        applyResponsiveSize()
        localStorage.setItem(RESPONSIVE_SIZE_KEY, JSON.stringify(savedSize))
    } else {
        deviceLandscape = !deviceLandscape
        localStorage.setItem(DEVICE_LANDSCAPE_KEY, deviceLandscape ? '1' : '0')
        applyDevice(viewModeEl.value)
    }
    void refresh()
})

// Stage background: colour + hatch of the #frame surround around the portal
// stage. Grayed out in Desktop mode — the iframe covers the frame edge-to-
// edge there, so there's nothing to colour. Nothing stored = default
// colour WITH hatching; the ↺ button returns to that default. (Same storage
// key as when this control lived in the visual-diff panel, so an already-
// picked colour carries over.)
const PAGE_BG_KEY = 'bring.visualDiff.pageBg'
const PAGE_BG_DEFAULT = '#0f0f1a'
const pageBgColorEl = $<HTMLInputElement>('pageBgColor')
const pageBgHatchBtn = $<HTMLButtonElement>('pageBgHatch')
const pageBgResetBtn = $<HTMLButtonElement>('pageBgReset')

type PageBg = { color: string; hatch: boolean }
let pageBg: PageBg | null = (() => {
    try {
        const parsed = JSON.parse(localStorage.getItem(PAGE_BG_KEY) || '') as Partial<PageBg>
        if (typeof parsed.color === 'string') return { color: parsed.color, hatch: !!parsed.hatch }
    } catch { /* nothing stored / corrupt — use the default */ }
    return null
})()
const savePageBg = () => {
    if (pageBg) localStorage.setItem(PAGE_BG_KEY, JSON.stringify(pageBg))
    else localStorage.removeItem(PAGE_BG_KEY)
}
// `live` paints a not-yet-committed picker value while the colour wheel is
// open. Inline styles override the `.frame.*` stylesheet backgrounds. The
// hatch stripe tint flips with the colour's luminance so the texture stays
// visible on both dark and light picks.
const applyPageBg = (live?: string) => {
    const active = live !== undefined
        ? { color: live, hatch: pageBg?.hatch ?? true }
        : pageBg ?? { color: PAGE_BG_DEFAULT, hatch: true }
    pageBgColorEl.value = active.color
    pageBgHatchBtn.classList.toggle('active', active.hatch)
    const hex = /^#[0-9a-fA-F]{6}$/.test(active.color) ? active.color : PAGE_BG_DEFAULT
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    const stripe = luminance > 0.55 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)'
    frameEl.style.background = hex
    frameEl.style.backgroundImage = active.hatch
        ? `repeating-linear-gradient(45deg, ${stripe} 0 8px, transparent 8px 16px)`
        : 'none'
}
// Repaint live while the picker is open; persist only on commit, so dragging
// through the colour wheel doesn't write on every frame.
pageBgColorEl.addEventListener('input', () => applyPageBg(pageBgColorEl.value))
pageBgColorEl.addEventListener('change', () => {
    pageBg = { color: pageBgColorEl.value, hatch: pageBg?.hatch ?? true }
    savePageBg()
    applyPageBg()
})
pageBgHatchBtn.addEventListener('click', () => {
    pageBg = { color: pageBgColorEl.value, hatch: !(pageBg?.hatch ?? true) }
    savePageBg()
    applyPageBg()
})
pageBgResetBtn.addEventListener('click', () => {
    pageBg = null
    savePageBg()
    applyPageBg()
})
applyPageBg()

const applyViewMode = (mode: string) => {
    frameEl.classList.toggle('mobile', mode === 'mobile')
    frameEl.classList.toggle('responsive', mode === 'responsive')
    const framed = mode === 'mobile' || mode === 'responsive'
    responsiveWidthEl.disabled = mode !== 'responsive'
    responsiveHeightEl.disabled = mode !== 'responsive'
    pageBgColorEl.disabled = !framed
    pageBgHatchBtn.disabled = !framed
    pageBgResetBtn.disabled = !framed
    applyDevice(mode)
}
const savedViewMode = localStorage.getItem(VIEW_MODE_KEY)
    || (['desktop', 'mobile', 'responsive'].includes(DEFAULT_VIEW_MODE) ? DEFAULT_VIEW_MODE : 'desktop')
viewModeEl.value = savedViewMode
applyViewMode(savedViewMode)
viewModeEl.addEventListener('change', () => {
    // Drop focus once picked (see the device select above).
    viewModeEl.blur()
    const mode = viewModeEl.value
    localStorage.setItem(VIEW_MODE_KEY, mode)
    applyViewMode(mode)
    // Re-bootstrap so the portal re-evaluates useMobilePortal at the new width.
    void refresh()
})

const clampSize = (el: HTMLInputElement, fallback: number) => {
    const min = Number(el.min)
    const max = Number(el.max)
    const value = Number(el.value)
    if (!Number.isFinite(value) || el.value.trim() === '') return fallback
    return Math.min(max, Math.max(min, Math.round(value)))
}
// Resize the stage live while typing; re-bootstrap only on commit (blur/Enter)
// since the portal reads innerWidth once at bootstrap.
const onSizeInput = () => {
    savedSize.w = clampSize(responsiveWidthEl, savedSize.w)
    savedSize.h = clampSize(responsiveHeightEl, savedSize.h)
    applyResponsiveSize()
}
const onSizeCommit = () => {
    onSizeInput()
    responsiveWidthEl.value = String(savedSize.w)
    responsiveHeightEl.value = String(savedSize.h)
    localStorage.setItem(RESPONSIVE_SIZE_KEY, JSON.stringify(savedSize))
    clearDeviceSelection()
    void refresh()
}
for (const el of [responsiveWidthEl, responsiveHeightEl]) {
    el.addEventListener('input', onSizeInput)
    el.addEventListener('change', onSizeCommit)
}

// Drag-resize: east/south edges and the SE corner of the responsive stage.
// Sizes are computed from the cursor position against the stage rect (not
// deltas) so the dragged edge tracks the cursor even though the stage is
// centered and shifts as it grows.
const frameStageEl = $<HTMLDivElement>('frameStage')
const clampNum = (value: number, el: HTMLInputElement) =>
    Math.min(Number(el.max), Math.max(Number(el.min), Math.round(value)))
const setupResizeHandle = (id: string, axes: { x?: boolean; y?: boolean }) => {
    const handle = $<HTMLDivElement>(id)
    handle.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        handle.setPointerCapture(e.pointerId)
        frameEl.classList.add('resizing')
        const startW = savedSize.w
        const startH = savedSize.h
        const onMove = (ev: PointerEvent) => {
            const rect = frameStageEl.getBoundingClientRect()
            if (axes.x) savedSize.w = clampNum(ev.clientX - rect.left, responsiveWidthEl)
            if (axes.y) savedSize.h = clampNum(ev.clientY - rect.top, responsiveHeightEl)
            applyResponsiveSize()
            responsiveWidthEl.value = String(savedSize.w)
            responsiveHeightEl.value = String(savedSize.h)
        }
        const onUp = () => {
            handle.removeEventListener('pointermove', onMove)
            frameEl.classList.remove('resizing')
            if (savedSize.w === startW && savedSize.h === startH) return
            localStorage.setItem(RESPONSIVE_SIZE_KEY, JSON.stringify(savedSize))
            clearDeviceSelection()
            // Re-bootstrap at the final size (portal reads innerWidth once).
            void refresh()
        }
        handle.addEventListener('pointermove', onMove)
        handle.addEventListener('pointerup', onUp, { once: true })
        handle.addEventListener('pointercancel', onUp, { once: true })
    })
}
setupResizeHandle('resizeE', { x: true })
setupResizeHandle('resizeS', { y: true })
setupResizeHandle('resizeSE', { x: true, y: true })

const STYLE_AS_KEY = 'bring-dev-wrapper:style-as'
styleAsEl.value = localStorage.getItem(STYLE_AS_KEY) || ''
styleAsEl.addEventListener('change', () => {
    localStorage.setItem(STYLE_AS_KEY, styleAsEl.value)
    // CSS loads at init time — must fully reload the iframe.
    isFirstLoad = true
    void refresh()
})

// Adds `?test=status` to the portal URL, which shows the portal's claim
// status-modal preview buttons. The portal ignores the flag on a prod build.
const STATUS_PREVIEW_KEY = 'bring-dev-wrapper:status-preview'
const statusPreviewEl = $<HTMLInputElement>('statusPreview')
statusPreviewEl.checked = localStorage.getItem(STATUS_PREVIEW_KEY) === '1'
statusPreviewEl.addEventListener('change', () => {
    localStorage.setItem(STATUS_PREVIEW_KEY, statusPreviewEl.checked ? '1' : '0')
    // The flag is read from the query string at bootstrap — reload to apply.
    isFirstLoad = true
    void refresh()
})

const startConnectedEl = $<HTMLInputElement>('startConnected')
startConnectedEl.checked = startConnected
startConnectedEl.addEventListener('change', () => {
    localStorage.setItem(START_CONNECTED_KEY, startConnectedEl.checked ? '1' : '0')
})
const manualConnectBtn = $<HTMLButtonElement>('manualConnect')
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

const logCountEl = $<HTMLSpanElement>('logCount')
let logCount = 0

function appendLog(kind: LogKind, label: string, payload?: unknown) {
    logCount++
    logCountEl.textContent = String(logCount)
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
    logCount = 0
    logCountEl.textContent = '0'
    logEl.innerHTML = ''
})

// "Window messages" drawer: raw postMessage recorder. Unlike the Event log
// (which only shows traffic the bridge accepts — `from: 'bringweb3'` with an
// action — and no sender metadata), this records EVERY message event this page
// receives with its origin and source window (portal iframe / self / other
// frame — e.g. a nested coupons iframe posting to `top`), plus every message
// the wrapper posts to the portal. Collapsed by default; the summary badge
// counts entries so activity is visible while closed.
const msgLogEl = $<HTMLDivElement>('msgLog')
const msgCountEl = $<HTMLSpanElement>('msgCount')
const clearMsgLogBtn = $<HTMLButtonElement>('clearMsgLog')
const MSG_LOG_MAX = 200
const MSG_PAYLOAD_MAX = 2000
let msgCount = 0

const stringifyPayload = (data: unknown): string => {
    let text: string
    try {
        text = typeof data === 'string' ? data : JSON.stringify(data, null, 2) ?? String(data)
    } catch {
        text = String(data)
    }
    return text.length > MSG_PAYLOAD_MAX
        ? `${text.slice(0, MSG_PAYLOAD_MAX)}… (${text.length} chars)`
        : text
}

const recordMessage = (direction: 'in' | 'out', meta: string, data: unknown) => {
    msgCount++
    msgCountEl.textContent = String(msgCount)
    const entry = document.createElement('div')
    entry.className = 'entry'
    const head = document.createElement('span')
    const tsSpan = document.createElement('span')
    tsSpan.className = 'ts'
    tsSpan.textContent = new Date().toLocaleTimeString(undefined, { hour12: false })
    const labelSpan = document.createElement('span')
    labelSpan.className = direction
    const action = (data as { action?: unknown } | null)?.action
    labelSpan.textContent = `${direction === 'in' ? '←' : '→'} ${typeof action === 'string' ? action : '(no action)'} · ${meta}`
    head.append(tsSpan, labelSpan)
    entry.appendChild(head)
    const pre = document.createElement('div')
    pre.textContent = stringifyPayload(data)
    entry.appendChild(pre)
    msgLogEl.appendChild(entry)
    while (msgLogEl.childElementCount > MSG_LOG_MAX) msgLogEl.firstElementChild?.remove()
    msgLogEl.scrollTop = msgLogEl.scrollHeight
}

const describeSource = (event: MessageEvent): string => {
    const from = event.source === window ? 'self'
        : event.source === iframeEl.contentWindow ? 'portal iframe'
        : 'other frame'
    return `${from} · ${event.origin || '(no origin)'}`
}

window.addEventListener('message', (event) => recordMessage('in', describeSource(event), event.data))

clearMsgLogBtn.addEventListener('click', () => {
    msgCount = 0
    msgCountEl.textContent = '0'
    msgLogEl.innerHTML = ''
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
type WalletProviderId = 'mock' | 'nightly' | 'solflare' | 'yoroi' | 'gero' | 'casper' | 'ecko' | 'ready'
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
let geroAdapter: MockWallet | null = null
const getGeroAdapter = (): MockWallet => {
    if (!geroAdapter) {
        geroAdapter = createGeroWallet({
            onSign: ({ key }) => appendLog('info', `Gero signed with ${shortAddress(key)}`),
        })
    }
    return geroAdapter
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
        case 'gero': return getGeroAdapter()
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
    // Outbound bridge posts also feed the raw "Window messages" drawer (inbound
    // is covered by its own window listener; the bridge posts carry an implicit
    // `to: 'bringweb3'` added in post()).
    log: (kind, label, payload) => {
        appendLog(kind, label, payload)
        if (kind === 'out') recordMessage('out', 'to portal', payload)
    },
    // LOGIN / SIGN_MESSAGE are always auto-answered (the bridge defaults to
    // responding); the old opt-out toggles were removed.
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

// "Start connected": bring the wallet up on load.
//  - mock: pre-fill the default address so the first bootstrap logs the portal
//    in, and sync the mock adapter's internal state to match.
//  - external: the extension owns the address, so we can't fill it in up front;
//    instead connect once the portal iframe has loaded, which prompts the
//    extension if it's available ("if possible").
if (startConnected) {
    if (activeProvider === 'mock') {
        if (DEFAULT_WALLET.trim()) {
            walletEl.value = DEFAULT_WALLET
            setWalletButton(DEFAULT_WALLET.trim())
            void mockAdapter.connect(DEFAULT_WALLET.trim())
        }
    } else {
        iframeEl.addEventListener('load', () => { void bridge.connect() }, { once: true })
    }
}

manualConnectBtn.addEventListener('click', () => {
    // For external wallets we never pass an override — the extension owns the key.
    const override = activeProvider === 'mock'
        ? (walletEl.value.trim() || DEFAULT_WALLET || undefined)
        : undefined
    void bridge.connect(override)
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
        // Optional wallet identity — /check/portal embeds these in the JWT,
        // surfaced in the Mobile Portal claim screen.
        walletName: walletNameEl.value.trim() || undefined,
        walletEmoji: walletEmojiEl.value.trim() || undefined,
        // Empty string means "don't include theme in the payload" so the
        // portal/API uses its own defaults.
        theme: (themeEl.value || undefined) as Theme | undefined,
        // Platform of the emulated device, so the backend can pass it through
        // to platform-sensitive iframe URLs (e.g. AppCard coupons).
        devicePlatform: getDevicePlatform(),
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

    // Only a SUCCESSFUL bootstrap consumed the current inputs — clear the
    // pending-edit highlight on the refresh icon now, not when the request
    // starts, so a failed call leaves the icon blue (the portal still hasn't
    // picked the edits up).
    refreshBtn.classList.remove('dirty')
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
        const src = buildIframeSrc(portalUrl!, token)
        const u = new URL(src)
        if (styleAsEl.value) u.searchParams.set('styleAs', styleAsEl.value)
        if (statusPreviewEl.checked) u.searchParams.set('test', 'status')
        iframeEl.src = u.toString()
        isFirstLoad = false
        setStatus('Loaded.')
    } else {
        // Subsequent updates (theme / extensionId): push fresh token via
        // SESSION_UPDATE — the same message used for wallet changes.
        try {
            const targetOrigin = new URL(iframeEl.src).origin
            const msg = { to: 'bringweb3', action: 'SESSION_UPDATE', token }
            iframeEl.contentWindow?.postMessage(msg, targetOrigin)
            recordMessage('out', 'to portal', msg)
            setStatus('Posted refreshed token to iframe.')
        } catch (err) {
            setStatus(`postMessage failed: ${(err as Error).message}`, true)
        }
    }
}

themeEl.addEventListener('change', refresh)
extensionEl.addEventListener('change', refresh)
walletNameEl.addEventListener('change', refresh)
walletEmojiEl.addEventListener('change', refresh)
refreshBtn.addEventListener('click', refresh)

// Text inputs only re-bootstrap on commit (blur/Enter), so while one is being
// edited the portal is stale. Highlight the refresh icon until the next
// bootstrap picks the edits up (committing the field, connecting the wallet,
// or clicking the icon all clear it via bootstrap()).
const markDirty = () => refreshBtn.classList.add('dirty')
for (const el of [extensionEl, walletEl, walletNameEl, walletEmojiEl]) {
    el.addEventListener('input', markDirty)
}

// Wallet identity persistence: "Start with this identity" stores the
// name/emoji so a page reload restores them BEFORE the first bootstrap — the
// very first check/portal call then already carries them, simulating an
// integration that always sends the identity. The checkbox is only available
// while a value is set, and the summary dot marks a set identity even when
// the drawer is collapsed.
const IDENTITY_KEY = 'bring-dev-wrapper:wallet-identity'
const identityStartEl = $<HTMLInputElement>('identityStart')
const identityDotEl = $<HTMLSpanElement>('identityDot')

const saveIdentity = () => {
    const name = walletNameEl.value.trim()
    const emoji = walletEmojiEl.value.trim()
    if (identityStartEl.checked && (name || emoji)) {
        localStorage.setItem(IDENTITY_KEY, JSON.stringify({ name, emoji }))
    } else {
        localStorage.removeItem(IDENTITY_KEY)
    }
}

const syncIdentityUi = () => {
    const anySet = Boolean(walletNameEl.value.trim() || walletEmojiEl.value.trim())
    identityDotEl.hidden = !anySet
    identityStartEl.disabled = !anySet
    // Clearing the last value withdraws the opt-in - nothing left to start with.
    if (!anySet && identityStartEl.checked) {
        identityStartEl.checked = false
        saveIdentity()
    }
}

// Restore before the initial refresh() below, so the first bootstrap already
// includes the stored identity.
try {
    const stored = JSON.parse(localStorage.getItem(IDENTITY_KEY) || '') as { name?: string; emoji?: string }
    if (stored.name) walletNameEl.value = stored.name
    if (stored.emoji) walletEmojiEl.value = stored.emoji
    if (stored.name || stored.emoji) identityStartEl.checked = true
} catch { /* nothing stored */ }
syncIdentityUi()

identityStartEl.addEventListener('change', saveIdentity)
for (const el of [walletNameEl, walletEmojiEl]) {
    el.addEventListener('input', syncIdentityUi)
    // Keep the stored copy in sync when an opted-in value is edited.
    el.addEventListener('change', saveIdentity)
}

// Wallet input edits go through the bridge so the mock wallet's internal state
// stays in sync and the same SESSION_UPDATE flow is used.
walletEl.addEventListener('change', () => {
    const v = walletEl.value.trim()
    if (v) void bridge.connect(v)
    else void bridge.disconnect()
})

refresh()
