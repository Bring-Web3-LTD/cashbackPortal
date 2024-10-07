interface ReactSelectOptionType {
    label: string
    value: string
}

interface Retailer {
    id: string
    iconPath: string
    name: string
    section: string
    backgroundColor: string
    maxCashback: number
    cashbackSymbol: string
    isFeatured: number
    exclusionCriteria: null
    termsPath: string
    cashbackCurrency: string
}

interface Category {
    id: number
    name: string
}

interface LoaderData {
    walletAddress: string
    platform: string
    cryptoSymbols: string[]
    isCountryAvailable: boolean
    iconsPath: string
}


interface Token {
    tokenSymbol: string
    tokenAmount: number
    tokenName: string
    minimumClaimThreshold: number
    tokenIconPath: string
    tokenInUsd: number
    totalEstimatedUsd: number
}

interface HistoryItem {
    date: string
    action: string
    tokenAmount: number
    tokenSymbol: string
}

interface Claim {
    action: string
    date: string
    tokenAmount: number
    tokenSymbol: string
    type?: "claim"
}

interface Deal {
    tokenSymbol: string
    tokenAmount: number
    startDate: string
    eligibleDate: string
    status: string
    tokenName: string
    retailerName: string
    retailerIconPath: string
    retailerBackgroundColor: string
    history: HistoryItem[]
    tokenIconPath: string
    tokenInUsd: number
    totalEstimatedUsd?: number
    date?: string
    type?: "deal"
}

interface Movements {
    claims: Claim[]
    deals: Deal[]
}