import { API_KEY, API_URL_PLATFORMS } from "../config"

interface Body extends BackendRequestBody {
    itemId: string
    walletAddress: string
    tokenSymbol: string
    search?: string
    platform: string
    isDemo?: boolean
}

interface Response {
    url: string
    cashbackInfoUrl: string | null
    iframeUrl: string
    token: string
    domain: string
}

const activate = async (body: Body): Promise<Response> => {
    const res = await fetch(`${API_URL_PLATFORMS}activate`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
        },
    })
    const data = await res.json()
    return data
}

export default activate