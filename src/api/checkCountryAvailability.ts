import { API_KEY, API_URL } from "../config"

const checkCountryAvailability = async (country?: string) => {
    const devCheck = country ? `?country=${country.toUpperCase()}` : ""

    const result = await fetch(`${API_URL}check-availability${devCheck}`, {
        method: "GET",
        headers: {
            "x-api-key": API_KEY,
        },
    })

    if (!result.ok) {
        throw new Error(result.statusText)
    }

    const data = await result.json()
    return data
}

export default checkCountryAvailability