import { API_URL_PLATFORMS } from "../config"
import { apiFetch } from "./request"

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

    const res = await apiFetch(`${API_URL_PLATFORMS}analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        platform: body.platform,
    })
    const data = await res.json();
    return data;
}

export default analytics;
