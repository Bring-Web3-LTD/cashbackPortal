import { API_URL_PLATFORMS } from "../config"
import { apiFetch } from "./request"

interface Body extends BackendRequestBody {
    walletAddress: string | undefined
    platform: string
    /** Support site from /verify, so the backend builds the FAQ's support
     *  links for this wrapper (support.rewrds.xyz on rewrds.xyz). The backend
     *  accepts only sites it knows; without it they stay on support.bring.network. */
    supportUrl?: string
}

interface Link {
    href: string,
    linkText: string
}

interface Faq {
    id: string
    itemOrder: number
    question: string
    answer: string[]
    links?: Link[]
}

interface Response {
    faq: Faq[]
    indentationMark: string
    status: number
}

const fetchFaq = async (body: Body): Promise<Response> => {

    if (!body.walletAddress) {
        body.walletAddress = 'null'
    }

    const res = await apiFetch(`${API_URL_PLATFORMS}faq`, { method: "POST", json: body })
    const data = await res.json()
    return data
}

export default fetchFaq
