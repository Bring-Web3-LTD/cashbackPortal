import { API_KEY, API_URL_PLATFORMS } from "../config"

interface Body {
    itemId: string
    walletAddress: string
    tokenSymbol: string
    search?: string
    platform: string
}

interface Response {
    url: string
    cashbackInfoUrl: string | null
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