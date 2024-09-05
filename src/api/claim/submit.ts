import { API_URL_platformNameS, API_KEY } from "../../config"

interface Body {
    walletAddress: string
    targetWalletAddress: string
    tokenSymbol: string
    tokenAmount: number
    signature: string
    message: string
    platformName: string
}

const claimSubmit = async (body: Body) => {
    const res = await fetch(`${API_URL_platformNameS}claim-submit`, {
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