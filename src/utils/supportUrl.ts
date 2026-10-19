import { ENV } from '../config'

const DEFAULT_SUPPORT_URL = 'https://support.bring.network/'

/**
 * Support site for this session. The backend picks it from the wrapper's
 * origin (`supportUrl` in the token); older tokens carry none, so fall back
 * to the Bring one. Only https is accepted, since it becomes a link href.
 */
const supportBase = (supportUrl?: string): URL => {
    try {
        const url = new URL(supportUrl || DEFAULT_SUPPORT_URL)
        if (url.protocol === 'https:') return url
    } catch { /* fall through */ }
    return new URL(DEFAULT_SUPPORT_URL)
}

/** "Missing a reward?" / "Need help?" link with the user's context. */
export const buildSupportUrl = (supportUrl: string | undefined, platform: string, walletAddress?: string | null): string => {
    const url = supportBase(supportUrl)
    url.searchParams.set('platform', platform)
    url.searchParams.set('address', walletAddress ?? '')
    url.searchParams.set('env', ENV)
    return url.toString()
}

const SUPPORT_URL_MARK = /\{\{\s*supportUrl\s*\}\}/gi

/**
 * Replaces {{supportUrl}} marks in retailer terms markdown with this session's
 * support site, the way injectCashback fills {{cashback}}. The terms files are
 * fetched straight from storage, so the backend cannot set the link there.
 */
export const injectSupportUrl = (markdown: string, supportUrl?: string): string =>
    markdown.replace(SUPPORT_URL_MARK, supportBase(supportUrl).toString())
