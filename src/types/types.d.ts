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