import { API_URL, API_KEY } from "../config"

interface Body {
    walletAddress: string | undefined
    type?: "default" | "aggregated"
    platform: string
}

interface Data {
    eligible: Token[]
    totalPendings: Token[]
    movements: Movements
}

interface Response {
    tokenIconBasePath: string
    retailerIconBasePath: string
    data: Data
}

const fetchCache = async (body: Body): Promise<Response> => {
    body.type = "aggregated"
    const res = await fetch(`${API_URL}cache`, {
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

export default fetchCache