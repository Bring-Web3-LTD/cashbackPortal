import { currencyFormat } from "../config";

const formatCashback = (amount: number, symbol: string, currency: string) => {
    try {
        if (symbol === '%') {
            return (amount / 100).toLocaleString(undefined, {
                style: 'percent',
                maximumFractionDigits: 2
            })
        } else if (currencyFormat === 'code') {
            return amount.toLocaleString(undefined, {
                style: 'currency',
                currencyDisplay: 'code',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }).split(/\s/).reverse().join(' ')
        }

        return amount.toLocaleString(undefined, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })

    } catch {
        return `${symbol}${amount}`
    }
}

export default formatCashback;