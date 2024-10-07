import { API_KEY, API_URL_PLATFORMS } from "../config"

interface Body {
    type: string
    country?: string
    search?: string
    category?: number
    page?: number
    pageSize?: number
    platform: string
}

interface Response {
    generalTermsUrl: string
    items: Retailer[]
    nextPageNumber: number | null
    prevPageNumber: number | null
    retailerIconBasePath: string
    retailerTermsBasePath: string
    totalItems: number
    iconQueryParam: string
}

const fetchRetailers = async (body: Body): Promise<Response> => {
    const res = await fetch(`${API_URL_PLATFORMS}retailers`, {
        method: "POST",
        body: JSON.stringify(body),
        mode: "cors",
        headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
        },
    })

    const data = await res.json()

    return data
}

export default fetchRetailers