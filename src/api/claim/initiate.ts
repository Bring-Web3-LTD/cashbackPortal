import { API_URL_PLATFORMS } from "../../config"
import { apiFetch } from "../request"

interface Body extends BackendRequestBody {
    walletAddress: string | null
    targetWalletAddress: string | null
    tokenSymbol: string
    tokenAmount: number
    platform: string
}

interface Response {
    messageToSign: string
    status?: number
    // Per-platform chain explorer URL for the resulting tx. Omitted by the
    // backend when no explorer is configured for the platform.
    explorerLink?: string
}

const claimInitiate = async (body: Body): Promise<Response> => {
    if (!body.walletAddress || !body.targetWalletAddress) {
        return { messageToSign: "", status: 400 }
    }

    const res = await apiFetch(`${API_URL_PLATFORMS}claim-init`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        platform: body.platform,
    })
    const data = await res.json()
    return data
}

export default claimInitiate