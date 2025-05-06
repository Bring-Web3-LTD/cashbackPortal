import { API_URL_PLATFORMS, API_KEY } from "../../config"

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
}

const claimInitiate = async (body: Body): Promise<Response> => {
    if (!body.walletAddress || !body.targetWalletAddress) {
        return { messageToSign: "", status: 400 }
    }

    const res = await fetch(`${API_URL_PLATFORMS}claim-init`, {
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

export default claimInitiate