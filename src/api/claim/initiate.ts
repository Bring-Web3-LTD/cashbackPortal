import { API_URL_PLATFORMS, API_KEY } from "../../config"

interface Body {
    walletAddress: string
    targetWalletAddress: string
    tokenSymbol: string
    tokenAmount: number
    platform: string
}

interface Response {
    messageToSign: string
    status?: number
}

const claimInitiate = async (body: Body): Promise<Response> => {
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