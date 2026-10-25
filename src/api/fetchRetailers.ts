import { API_URL_PLATFORMS } from "../config"
import { apiFetch } from "./request"

interface Body extends BackendRequestBody {
    type: string
    country?: string
    search?: string
    category?: number
    page?: number
    pageSize?: number
    platform: string
}

interface Response {
    topGeneralTermsUrl: string
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
    const res = await apiFetch(`${API_URL_PLATFORMS}retailers`, { method: "POST", mode: "cors", json: body })

    const data = await res.json()

    return data
}

export default fetchRetailers
