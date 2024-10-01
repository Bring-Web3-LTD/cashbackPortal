export const formatCurrency = (amount: number | undefined) => {
    if (!amount) return undefined
    return amount.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
    })
}

export const formatDate = (date: string): string => {
    const format = new Date(date)

    return format.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

export const daysLeft = (date: string): number => {
    const targetDate: Date = new Date(date)

    const currentDate: Date = new Date()

    const timeDifference: number = targetDate.getTime() - currentDate.getTime()

    return Math.max(1, Math.ceil(timeDifference / (1000 * 60 * 60 * 24)))
}

export const formatStatus = (status: string, eligibleDate?: string) => {
    let days: number | undefined = undefined
    if (eligibleDate) {
        days = daysLeft(eligibleDate)
    }

    switch (status) {
        case "claimed":
            return "Claimed";
        case "completed":
            return "Completed";
        case "pending":
            return `In ${days} ${days && days > 1 ? "days" : "day"}`;
        case "canceled":
            return "Canceled";
        default:
            return `In ${days} ${days && days > 1 ? "days" : "day"}`;
    }
}

interface Item {
    date: string
    description: string
    action: string
    tokenAmount: number
    tokenSymbol: string
    correctionReason: string
    retailerName: string
}

export const createDescription = (item: Item) => {
    if (item.description) {
        return [formatDate(item.date), item.description]
    }

    switch (item.action) {
        case "PURCHASE_POSTED":
            return [formatDate(item.date),
            `${item.tokenAmount + " " + item.tokenSymbol} rewards for purchasing
                        at ${item.retailerName}.Status: Pending for the end of the return period.`]
        case "PURCHASE_APPROVED":
            return [formatDate(item.date), `${item.tokenAmount + " " + item.tokenSymbol} eligible rewards for purchasing at { retailerName }.`]
        case "PURCHASE_CORRECTED":
            return (
                [formatDate(item.date),
                `${item.tokenAmount + " " + item.tokenSymbol} — purchase corrected. ${item.correctionReason ? item.correctionReason : ""}`]
            )
    }
}