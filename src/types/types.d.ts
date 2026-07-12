interface ReactSelectOptionType {
    label: string
    value: string
}

interface Retailer {
    id: string
    iconPath: string
    name: string
    displayName: string
    section: string
    backgroundColor: string
    maxCashback: number
    cashbackSymbol: string
    isFeatured: number
    exclusionCriteria: null
    termsPath: string
    campaignPath?: string
    cashbackCurrency: string
    campaignId?: number
}

interface Category {
    id: number
    name: string
}

interface CryptoToken {
    symbol: string
    name: string
    icon: string
}

interface LoaderData {
    walletAddress: string
    platform: string
    cryptoSymbols: string[]
    cryptoTokens?: CryptoToken[]
    isCountryAvailable: boolean
    iconsPath: string
    defaultIconsPath: string
    flowId: string
    userId: string
    isTester: boolean
    extensionId: string | null
    showTerms: boolean
    autoclaim: boolean
    // Mobile Portal — optional wallet identity surfaced from the JWT, plus the
    // computed flag that drives whether the mobile UI is rendered for this load.
    walletEmoji?: string
    walletName?: string
    useMobilePortal?: boolean
    variant: string
}


interface Token {
    tokenSymbol: string
    tokenAmount: number
    tokenName: string
    minimumClaimThreshold: number
    tokenIconPath: string
    tokenInUsd: number
    totalEstimatedUsd: number
    // Backend-formatted display string for the amount. May contain Unicode
    // subscript digits (₀–₉) — render via <TokenAmount /> on mobile.
    tokenAmountDisplay?: string
}

interface HistoryItem {
    date: string
    action: string
    tokenAmount: number
    tokenSymbol: string
    // Backend-formatted display string for the amount.
    tokenAmountDisplay?: string
}

interface Claim {
    action: string
    date: string
    tokenAmount: number
    tokenSymbol: string
    type?: "claim"
    txid?: string
    // Backend-formatted display string for the amount.
    tokenAmountDisplay?: string
    // Per-platform chain explorer URL for this claim's tx. Hide UI when absent.
    explorerLink?: string
}

interface Deal {
    tokenSymbol: string
    tokenAmount: number
    startDate: string
    eligibleDate: string
    status: string
    tokenName: string
    retailerName: string
    retailerDisplayName: string
    retailerIconPath: string
    retailerBackgroundColor: string
    history: HistoryItem[]
    tokenIconPath: string
    tokenInUsd: number
    totalEstimatedUsd?: number
    date?: string
    type?: "deal"
    // Backend-formatted display string for the amount.
    tokenAmountDisplay?: string
}

interface Movements {
    claims: Claim[]
    deals: Deal[]
}

interface Link {
    href: string,
    linkText: string
}

interface BackendRequestBody {
    userId: string
    walletAddress?: string | null
    platform: string
    flowId: string
}

interface BackendRequestParams {
    user_id: string
    wallet_address?: string
    platform: string
    flow_id: string
}