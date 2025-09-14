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
