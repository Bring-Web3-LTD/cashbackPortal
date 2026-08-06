import { API_URL_PORTAL, API_KEY } from "../config"
import message from "../utils/message"

interface Body {
    token: string
}

interface Response {
    status: number
    info: {
        isCountryAvailable: boolean
        platform: string
        cryptoSymbols: string[]
        cryptoTokens?: CryptoToken[]
        walletAddress: string | null
        userId: string | undefined
        isTester?: boolean
        autoclaim?: boolean
        theme?: string
        terms?: boolean
        extensionId?: string
        // Optional wallet identity fields passed through from /check/portal
        // and embedded in the issued JWT. Surfaced in the Mobile Portal UI.
        walletEmoji?: string
        walletName?: string
        bringTou?: string
        privacy?: string
        // Coupons iframe URL (mobile-only feature); absent when the wallet
        // isn't connected or the platform has no coupons integration.
        couponsIframeSrc?: string
    }
}

const fetchToken = async (body: Body): Promise<Response> => {
    let status = 0
    try {
        const res = await fetch(`${API_URL_PORTAL}verify`, {
            method: "POST",
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...body })
        })
        status = res.status
        const data = await res.json()

        if (!res.ok || data.status !== 200 || !data.info || !Object.keys(data.info).length) {
            throw Error('There was an error while loading the page')
        }

        if (data.info.walletAddress === 'null') {
            data.info.walletAddress = null
        }

        return data
    } catch (err) {
        message({ action: 'PORTAL_ERROR', type: 'VERIFY', status })
        throw err
    }
}

export default fetchToken