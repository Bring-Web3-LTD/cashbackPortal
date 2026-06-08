export type MobileClaimModalState =
    | 'confirm'
    | 'processing'
    | 'success'
    | 'failure'
    | 'minimum'

export const shortenWalletAddress = (
    value: string | null | undefined,
    left = 4,
    right = 4,
): string => {
    if (!value) return ''
    if (value.length <= left + right) return value
    return `${value.slice(0, left)}...${value.slice(-right)}`
}

export const formatSignedAmount = (display: string, amount: number): string => {
    if (!display) return '0.00'
    return amount > 0 && !display.startsWith('+') ? `+${display}` : display
}

export const formatNetworkFee = (tokenSymbol: string): string =>
    `0.001 ${tokenSymbol}`.trim()
