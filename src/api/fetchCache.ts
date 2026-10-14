import { API_URL_PLATFORMS } from "../config"
import { apiFetch, setSignedIn } from "./request"

interface Body extends BackendRequestBody {
    type?: "default" | "aggregated"
    platform: string
}

interface Data {
    eligible: Token[]
    totalPendings: Token[]
    totalEarned?: Token[]
    movements: Movements
    /** No rewards and no history at all. Absent until the call resolves. */
    firstTimeUser?: boolean
}

interface Response {
    tokenIconBasePath: string
    retailerIconBasePath: string
    data: Data
}

const fetchCache = async (body: Body): Promise<Response> => {
    body.type = "aggregated"

    const res = await apiFetch(`${API_URL_PLATFORMS}cache`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        platform: body.platform,
    })

    // Without a wallet the backend answers from the session cookie: a 400
    // ("Missing walletAddress") means it found none, a 200 means it did.
    if (!body.walletAddress && (res.ok || res.status === 400)) setSignedIn(res.ok)

    const data = await res.json()
    return data
}

export default fetchCache
