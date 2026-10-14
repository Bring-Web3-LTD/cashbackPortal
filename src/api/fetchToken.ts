import { API_URL_PORTAL } from "../config"
import message from "../utils/message"
import { apiFetch } from "./request"

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
        // Dashboard state, resolved server side from the API key.
        isHub?: boolean
        couponsEnabled?: boolean
        firstTimeUser?: boolean
        /** Coupon partner iframe. Null when coupons are off or outside the US. */
        couponsIframeSrc?: string | null
        /** Where the claim guide sends a hub user to install the wallet. */
        chromeStoreUrl?: string
    }
}

const fetchToken = async (body: Body): Promise<Response> => {
    let status = 0
    try {
        // No `platform` yet - the token is where it comes from - so a 401 here
        // is not refreshed; the backend reads the platform off the token itself.
        const res = await apiFetch(`${API_URL_PORTAL}verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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