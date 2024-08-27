import { API_URL, API_KEY } from "../../config"

interface Body {
    walletAddress: string
    targetWalletAddress: string
    tokenSymbol: string
    tokenAmount: number
    signature: string
    message: string
    platform: string
}

const claimSubmit = async (body: Body) => {
    const res = await fetch(`${API_URL}claim-submit`, {
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

export default claimSubmit