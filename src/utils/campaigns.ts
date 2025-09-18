interface Campaign {
    name: string
    amount: string
    symbol: string
}

interface Campaigns {
    [key: string]: {
        [key: number]: {
            [key: string]: Campaign
        }
    }
}

const campaigns: Campaigns = {
    argent: {
        1023: {
            'a392cf154ee26de29bd59ce937f585b1a482bb43': {
                name: "Nike",
                amount: "50",
                symbol: "%"
            },
            'd52684322843300f4c40380a1cb89bdb7b72e274': {
                name: "AliExpress",
                amount: "70",
                symbol: "%"
            },
            "a91ab933c971ab9782b57b39377fc6b9aa878294": {
                name: "Macy's",
                amount: "85",
                symbol: "%"
            },
            "ca0b67c6c085f1f22dfc04267917b59ef460de87": {
                name: "Sephora",
                amount: "85",
                symbol: "%"
            },
            "d4cfdf3e9552e9d9233a0675a9070baa509f651f": {
                name: "Expedia",
                amount: "85",
                symbol: "%"
            }
        }
    }
}

export const getCampaign = (platform: string, campaignId: number, hash: string): Campaign | null => {
    return campaigns[platform]?.[campaignId]?.[hash] || null
}

export const parseCampaignId = (campaignId: string | null): { id: number, hash: string } | null => {
    if (!campaignId) return null

    const arr = campaignId.split('-').filter(str => str.length)

    if (arr.length !== 2) return null

    const id = Number(arr[0])

    const hash = arr[1]

    if (isNaN(id)) return null

    return { id, hash }
}
