import { API_KEY, API_URL } from "../config"

interface Body {
    type: string
    country?: string
    search?: string
    category?: number
    page?: number
    pageSize?: number
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
    const res = await fetch(`${API_URL}retailers`, {
        method: "POST",
        body: JSON.stringify({ ...body, platform: 'yoroi', country: 'us' }),
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