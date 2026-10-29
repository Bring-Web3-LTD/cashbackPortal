// Standalone mode (TODO#701): on these hosts, with no `token` in the URL, the
// portal runs top-level as the Bring portal with no wrapper and fetches its own
// session from /check/portal. Outside prod, `?standalone=true` forces it (the
// dev wrapper's Standalone toggle), so localhost needs no entry in the list.
const STANDALONE_HOSTS: string[] = import.meta.env.VITE_STANDALONE_HOSTS
    ? import.meta.env.VITE_STANDALONE_HOSTS.split(',')
    : []
const pageParams = new URLSearchParams(window.location.search)
export const STANDALONE = !pageParams.has('token') && (
    STANDALONE_HOSTS.includes(window.location.hostname)
    || (import.meta.env.VITE_ENV !== 'prod' && pageParams.get('standalone') === 'true')
)
// The Bring portal key, used only for the standalone /check/portal call
export const STANDALONE_API_KEY = import.meta.env.VITE_STANDALONE_API_KEY || ''
// envName (localStorage, or ?envName= outside prod) → api.bringweb3.io/{envName}/v1/,
// as in the extension. Stage segment only, so the host stays Bring's.
const readEnvName = (): string => {
    try {
        const envName = (import.meta.env.VITE_ENV !== 'prod' && pageParams.get('envName'))
            || localStorage.getItem('envName') || ''
        return /^[\w-]+$/.test(envName) ? envName : ''
    } catch {
        return ''
    }
}
const ENV_NAME = readEnvName()
// Standalone mode calls its own API host (api.rewrds.xyz in prod), so the
// session cookies stay first-party; falls back to VITE_API_URL when unset
const API_URL = ENV_NAME
    ? `https://api.bringweb3.io/${ENV_NAME}/v1/`
    : (STANDALONE && import.meta.env.VITE_STANDALONE_API_URL) || import.meta.env.VITE_API_URL

export const API_KEY = import.meta.env.VITE_API_KEY || ''
export const API_URL_PLATFORMS = `${API_URL}platforms/`
export const API_URL_PORTAL = `${API_URL}portal/`
// bringAuth lambda — /v1/auth/* (email OTP + wallet↔email pairing).
export const API_URL_AUTH = `${API_URL}auth/`
export const DEV_MODE = import.meta.env.VITE_ENV === 'development'
export const TEST_ID = import.meta.env.VITE_TEST_ID || ''
export const ENV = import.meta.env.VITE_ENV || 'development'
export const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'
export const SHOW_TERMS_PLATFORMS = import.meta.env.VITE_SHOW_TERMS_PLATFORMS ? import.meta.env.VITE_SHOW_TERMS_PLATFORMS.split(',') : []

// Per-platform currency display format.
// 'code' shows "USD", 'symbol' shows "$".
const CURRENCY_CODE_PLATFORMS = ['YOROI']
export let currencyFormat: 'code' | 'symbol' = 'symbol'
export const setCurrencyFormat = (platform: string) => {
    currencyFormat = CURRENCY_CODE_PLATFORMS.includes(platform) ? 'code' : 'symbol'
}

// Mobile Portal — opt-in per platform, only renders below the viewport threshold.
export const MOBILE_PORTAL_PLATFORMS: string[] = import.meta.env.VITE_MOBILE_PORTAL_PLATFORMS
    ? import.meta.env.VITE_MOBILE_PORTAL_PLATFORMS.split(',')
    : []
export const MOBILE_PORTAL_MAX_WIDTH: number = import.meta.env.VITE_MOBILE_PORTAL_MAX_WIDTH
    ? Number(import.meta.env.VITE_MOBILE_PORTAL_MAX_WIDTH)
    : 360

// Per-platform overrides of the shared threshold — Solflare's mobile design is
// drawn at 375. Platforms not listed use MOBILE_PORTAL_MAX_WIDTH.
const MOBILE_PORTAL_MAX_WIDTHS: Record<string, number> = { SOLFLARE: 375 }

/** Viewport cap (and layout width) of the mobile portal for `platform`. */
export const mobilePortalMaxWidth = (platform: string | null | undefined): number =>
    MOBILE_PORTAL_MAX_WIDTHS[(platform || '').toUpperCase()] ?? MOBILE_PORTAL_MAX_WIDTH
