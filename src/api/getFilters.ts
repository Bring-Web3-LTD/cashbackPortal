import { API_URL, API_KEY } from "../config"

const getFilters = async (country?: string) => {
    const devCheck = country ? `?country=${country.toUpperCase()}` : ""

    const res = await fetch(`${API_URL}categories-search${devCheck}`, {
        method: "GET",
        headers: {
            "x-api-key": API_KEY,
        },
    })
    const data = await res.json()
    return data
}

export default getFilters