import { API_KEY, API_URL } from "../config"

interface Body {
    itemId: string
    walletAddress: string
    tokenSymbol: string
    search?: string
}

interface ActivateResponse {
    url: string
    cashbackInfoUrl: string | null
}

const activate = async (body: Body) => {
    const res = await fetch(`${API_URL}activate`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
        },
    })
    const data = await res.json()
    return data as ActivateResponse
}

export default activate