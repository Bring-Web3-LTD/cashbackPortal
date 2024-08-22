import { API_URL, API_KEY } from "../config"

interface Body {
    walletAddress: `0x${string}` | undefined
    type?: "default" | "aggregated"
}

const fetchCache = async (body: Body) => {
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