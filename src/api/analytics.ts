import { API_URL_PLATFORMS, API_KEY } from "../config"

interface Body {
    type: string
    platform: string
    userId?: string
    walletAddress?: string
    category?: string
    action?: string
    process?: string
    details?: unknown
    retailer?: string
    flowId: string
    timestamp?: number
}

const analytics = async (body: Body) => {
    body.timestamp = Date.now()

    const res = await fetch(`${API_URL_PLATFORMS}analytics`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify(body)
    })
    const data = await res.json();
    return data;
}

export default analytics;