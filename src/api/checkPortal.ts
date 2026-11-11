import { API_URL_PLATFORMS, STANDALONE_API_KEY } from "../config"
import { refreshSession } from "./request"

// Standalone mode only: the session token a wrapper would otherwise have put on
// the iframe URL. The portal key decides the platform (and isHub).
const checkPortal = async (flowId: string | null): Promise<string> => {
    // Without a key API Gateway 403s with no CORS headers, which the browser
    // only reports as "Failed to fetch"
    if (!STANDALONE_API_KEY) throw Error('Standalone mode needs VITE_STANDALONE_API_KEY')
    const send = () => fetch(`${API_URL_PLATFORMS}check/portal`, {
        method: "POST",
        // The session lives in HttpOnly cookies: send them, so a signed-in user
        // gets the JWT of their email identity rather than an anonymous one
        credentials: "include",
        headers: {
            "x-api-key": STANDALONE_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ flowId: flowId || undefined })
    })
    let res = await send()
    // 401: the ID cookie's token expired (hourly) while the cookie itself lives
    // on. Refresh it and ask again. A refresh that answers 401 clears both
    // cookies, so the second call comes back anonymous and the sign-in shows.
    if (res.status === 401 && await refreshSession()) res = await send()
    const data = await res.json()
    if (!res.ok || typeof data.token !== 'string') throw Error('There was an error while loading the page')
    return data.token
}

export default checkPortal
