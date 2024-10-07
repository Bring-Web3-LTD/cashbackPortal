const formatCashback = (amount: number, symbol: string, currency: string) => {
    try {
        if (amount === 39) {
            console.log('test');
            console.log({ amount, symbol, currency });


        }
        if (symbol === '%') {
            return (amount / 100).toLocaleString(undefined, {
                style: 'percent',
                maximumFractionDigits: 2
            })
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