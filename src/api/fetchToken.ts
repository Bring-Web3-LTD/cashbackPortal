import { API_URL_PORTAL, API_KEY } from "../config"

interface Body {
    token: string
}

interface Response {
    status: number
    info: {
        isCountryAvailable: boolean
        platform: string
        cryptoSymbols: string[]
        walletAddres: string
        userId: string | undefined
    }
}

const fetchToken = async (body: Body): Promise<Response> => {
    const res = await fetch(`${API_URL_PORTAL}verify`, {
        method: "POST",
        headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...body })
    })
    const data = await res.json()
    return data
}

export default fetchToken