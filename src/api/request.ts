/**
 * The one fetch every portal API call goes through.
 *
 * Adds the API key and `credentials: 'include'`, so the portal session - two
 * HttpOnly cookies bringAuth set at sign-in - rides along. The ID cookie's
 * token expires hourly; the backend then answers 401, and this refreshes it
 * (`POST /v1/auth/session/refresh`) and retries the call once. Concurrent 401s
 * share one refresh. A 401 from the refresh itself means the session is gone.
 *
 * `/v1/auth/*` is never retried: those endpoints do not act on the session,
 * and the refresh must not refresh itself.
 *
 * Cookies travel only once `enableSessionCookies()` has run, which the root
 * loader does for the hub. A wallet user has no session, and a credentialed
 * request is refused by the browser unless the API answers with an exact
 * origin and `Access-Control-Allow-Credentials` - so wallet mode keeps sending
 * exactly what it sent before.
 */
import { useSyncExternalStore } from 'react'
import { API_KEY, API_URL_AUTH } from '../config'

let sessionCookies = false

/** Hub only: from here on every call carries the session cookies and refreshes on 401. */
export const enableSessionCookies = () => { sessionCookies = true }

// ── Signed-in state ────────────────────────────────────────────────────
// The cookies are HttpOnly, so the page only ever learns whether it is signed
// in from how the backend answers. `undefined` until something has answered.
let signedIn: boolean | undefined
const listeners = new Set<() => void>()

/** False on a failed refresh or a session-less `cache`; true once sign-in verifies. */
export const setSignedIn = (value: boolean) => {
    if (signedIn === value) return
    signedIn = value
    listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
}

export const useSignedIn = () => useSyncExternalStore(subscribe, () => signedIn)

// ── Refresh ────────────────────────────────────────────────────────────
// One in-flight refresh at a time: every 401 that lands while it runs awaits
// the same promise rather than spending the refresh token again.
let refreshing: Promise<boolean> | undefined

const refreshSession = (platform: string): Promise<boolean> =>
    (refreshing ??= fetch(`${API_URL_AUTH}session/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
    })
        .then((res) => {
            if (res.ok) setSignedIn(true)
            // Only a 401 says the session is over; anything else is a fault
            // of the call, not of the session.
            if (res.status === 401) setSignedIn(false)
            return res.ok
        })
        .catch(() => false)
        .finally(() => { refreshing = undefined }))

// ── Fetch ──────────────────────────────────────────────────────────────
export interface ApiInit extends RequestInit {
    /** Names the platform on the refresh body. Without it a 401 is not retried. */
    platform?: string
}

export const apiFetch = async (url: string, { platform, ...init }: ApiInit = {}): Promise<Response> => {
    const send = () => fetch(url, {
        ...init,
        credentials: sessionCookies ? 'include' : 'same-origin',
        headers: { 'x-api-key': API_KEY, ...init.headers },
    })

    const res = await send()
    if (!sessionCookies || res.status !== 401 || !platform || url.includes('/auth/')) return res
    return (await refreshSession(platform)) ? send() : res
}
