import { API_URL_PLATFORMS, STANDALONE_API_KEY } from "../config"

// Standalone mode only: the session token a wrapper would otherwise have put on
// the iframe URL. The Bring portal key decides the platform (and isHub).
const checkPortal = async (flowId: string | null): Promise<string> => {
    // Without a key API Gateway 403s with no CORS headers, which the browser
    // only reports as "Failed to fetch"
    if (!STANDALONE_API_KEY) throw Error('Standalone mode needs VITE_STANDALONE_API_KEY')
    const res = await fetch(`${API_URL_PLATFORMS}check/portal`, {
        method: "POST",
        headers: {
            "x-api-key": STANDALONE_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ flowId: flowId || undefined })
    })
    const data = await res.json()
    if (!res.ok || typeof data.token !== 'string') throw Error('There was an error while loading the page')
    return data.token
}

export default checkPortal
