import { API_KEY, API_URL } from "../config"

interface Options {
    country?: string
    platform: string
}

const checkCountryAvailability = async ({ country, platform }: Options): Promise<boolean> => {
    const devCheck = country ? `&country=${country.toUpperCase()}` : ""

    const result = await fetch(`${API_URL}check-availability?platform=${platform}${devCheck}`, {
        method: "GET",
        headers: {
            "x-api-key": API_KEY,
        },
    })

    if (!result.ok) {
        throw new Error(result.statusText)
    }

    const data = await result.json()
    return data.isAvailable
}

export default checkCountryAvailability