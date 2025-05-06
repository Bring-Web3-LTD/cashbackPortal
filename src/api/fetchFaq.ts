import { API_URL_PLATFORMS, API_KEY } from "../config"

interface Body extends BackendRequestBody {
    walletAddress: string | undefined
    platform: string
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

    const res = await fetch(`${API_URL_PLATFORMS}faq`, {
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

export default fetchFaq