interface Campaign {
    name: string
    amount: string
    symbol: string
}

interface Campaigns {
    [key: string]: {
        [key: number]: Campaign
    }
}

const campaigns: Campaigns = {
    argent: {
        1023: {
            name: "AliExpress EU",
            amount: "50",
            symbol: "%"
        },
        1024: {
            name: "Adidas",
            amount: "70",
            symbol: "%"
        }
    }
}

const getCampaign = (platform: string, campaignId: number): Campaign | null => {
    return campaigns[platform]?.[campaignId] || null
}

export default getCampaign;