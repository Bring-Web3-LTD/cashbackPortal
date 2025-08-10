const fetchTerms = async (url: string): Promise<string> => {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
    }
    return response.text()
}

export default fetchTerms;