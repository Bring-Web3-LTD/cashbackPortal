import { API_KEY, API_URL } from "../config"

interface Body {
    type: string
    country?: string
    search?: string
    category?: number
    page?: number
    pageSize?: number
}

const fetchRetailers = async (body: Body) => {
    const res = await fetch(`${API_URL}retailers`, {
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

export default fetchRetailers