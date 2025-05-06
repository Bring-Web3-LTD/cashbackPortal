import { API_URL_PLATFORMS, API_KEY } from "../../config"

interface Body extends BackendRequestBody {
    walletAddress: string | null
    targetWalletAddress: string | null
    tokenSymbol: string
    tokenAmount: number
    signature: string
    key?: string
    message: string
    platform: string
}

const claimSubmit = async (body: Body) => {
    if (!body.walletAddress || !body.targetWalletAddress) return

    const res = await fetch(`${API_URL_PLATFORMS}claim-submit`, {
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