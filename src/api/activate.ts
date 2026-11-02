import { API_URL_PLATFORMS } from "../config"
import { apiFetch } from "./request"

// A hub user sends neither `walletAddress` nor `userId`: the backend then
// credits the session's email identity, and a `userId` in the body would
// override that server-side.
interface Body extends BackendRequestBody {
    itemId: string
    tokenSymbol: string
    search?: string
    platform: string
    isDemo?: boolean
}

interface Response {
    url: string
    cashbackInfoUrl: string | null
    iframeUrl: string
    token: string
    domain: string
}

const activate = async (body: Body): Promise<Response> => {
    const res = await apiFetch(`${API_URL_PLATFORMS}activate`, { method: "POST", json: body })
    const data = await res.json()
    return data
}

export default activate
