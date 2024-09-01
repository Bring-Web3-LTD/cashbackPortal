import { API_URL_PLATFORMS, API_KEY } from "../config"

interface Options {
    country?: string
    platform: string
}

interface Response {
    categories: {
        items: [
            {
                id: number
                name: string
                // iconSvg: string
            },
        ]
    }
    searchTerms: {
        items: string[]
    }
}

const getFilters = async ({ country, platform }: Options): Promise<Response> => {
    const devCheck = country ? `&country=${country.toUpperCase()}` : ""

    const res = await fetch(`${API_URL_PLATFORMS}categories-search?platform=${platform}${devCheck}`, {
        method: "GET",
        headers: {
            "x-api-key": API_KEY,
        },
    })
    const data = await res.json()
    return data
}

export default getFilters