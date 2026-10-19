import { API_URL_PLATFORMS } from "../../config"
import { apiFetch } from "../request"

interface Body extends BackendRequestBody {
    walletAddress: string | null
    targetWalletAddress: string | null
    tokenSymbol: string
    tokenAmount: number
    signature: string
    key?: string
    message: string
    platform: string
}

interface Response {
    // True for any 2xx HTTP status, so callers don't hard-code a single code.
    ok: boolean
    // Per-platform chain explorer URL for the submitted tx. Omitted by the
    // backend when no explorer is configured for the platform.
    explorerLink?: string
}

const claimSubmit = async (body: Body): Promise<Response | undefined> => {
    if (!body.walletAddress || !body.targetWalletAddress) return

    const res = await apiFetch(`${API_URL_PLATFORMS}claim-submit`, { method: "POST", json: body })
    const data = await res.json().catch(() => ({}))
    return { ...data, ok: res.ok }
}

export default claimSubmit