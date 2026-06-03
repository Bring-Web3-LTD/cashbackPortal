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

interface Response {
    status?: number
    // Per-platform chain explorer URL for the submitted tx. Omitted by the
    // backend when no explorer is configured for the platform.
    explorerLink?: string
}

const claimSubmit = async (body: Body): Promise<Response | undefined> => {
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