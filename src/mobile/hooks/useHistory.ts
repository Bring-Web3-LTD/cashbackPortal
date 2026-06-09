/**
 * Mobile History data hook — selector around `useBalance`.
 *
 * Flattens `balance.movements.claims` (grouped per token-symbol into a
 * single "Total Claims" row) + `balance.movements.deals` (one row each)
 * into a single normalized list ready for `<MobileHistoryItem />`.
 *
 * Mirrors the desktop/legacy mobile History list logic in
 * `src/pages/History/Mobile/History.tsx` but adapted to a React-Query
 * selector pattern so the page component stays presentation-only.
 */
import { useBalance } from './useBalance'
import {
    createDescription,
    formatDate,
    formatStatus,
} from '../../pages/History/helpers'

export interface MobileHistoryRow {
    id: string
    /** Display name. Claims aggregate as "Total Claims". */
    retailerName: string
    /** Formatted date string ("MMM d, yyyy"); empty for the claims aggregate. */
    date: string
    /** Resolved <img src> for the leading round icon. */
    iconSrc: string
    /** Optional background colour behind a deal logo (per-retailer brand). */
    iconBg?: string
    /** True for the claims aggregate row — drives the gift-icon avatar styling. */
    isClaim: boolean
    /** Amount display string (may contain subscripts), without symbol. */
    amountDisplay: string
    /** Token symbol (used as a stable key for claims aggregation). */
    tokenSymbol: string
    /** Formatted status: "Claimed" | "Completed" | "Cancelled" | "In X days". */
    status: string
    /** Lowercased raw status for styling hooks (claimed/completed/cancelled/pending). */
    rawStatus: string
    /** Description rows shown when the item is expanded; mirrors desktop. */
    description: string[][]
}

/** Row date format: MM/DD/YYYY (e.g. "05/08/2026"). */
const formatRowDate = (date: string): string => {
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })
}

const statusKey = (raw: string, formatted: string): string => {
    const r = raw.toLowerCase()
    if (r === 'claimed') return 'claimed'
    if (r === 'completed') return 'completed'
    if (r === 'cancelled' || r === 'canceled') return 'cancelled'
    if (formatted.startsWith('In ')) return 'pending'
    return r || 'pending'
}

interface UseHistoryResult {
    rows: MobileHistoryRow[]
    isLoading: boolean
}

export const useHistory = (): UseHistoryResult => {
    const query = useBalance()

    const balance = query.data?.data
    const retailerIconBasePath = query.data?.retailerIconBasePath

    const rows: MobileHistoryRow[] = []

    // ── Claims: aggregate per tokenSymbol into one "Total Claims" row. ──
    const claimsBySymbol: Record<
        string,
        { tokenAmount: number; description: string[][] }
    > = {}
    balance?.movements?.claims?.forEach((claim) => {
        const key = claim.tokenSymbol
        if (!claimsBySymbol[key]) {
            claimsBySymbol[key] = { tokenAmount: 0, description: [] }
        }
        claimsBySymbol[key].tokenAmount += claim.tokenAmount
        const desc: string[] = [
            formatDate(claim.date),
            `${claim.tokenAmountDisplay ?? claim.tokenAmount} ${claim.tokenSymbol}`,
        ]
        if (claim.txid) desc.push(claim.txid)
        claimsBySymbol[key].description.push(desc)
    })

    Object.entries(claimsBySymbol).forEach(([symbol, agg]) => {
        rows.push({
            id: `claim-${symbol}`,
            retailerName: 'Total Claims',
            date: '',
            iconSrc: '',
            isClaim: true,
            amountDisplay: String(agg.tokenAmount),
            tokenSymbol: symbol,
            status: formatStatus('claimed'),
            rawStatus: 'claimed',
            description: agg.description,
        })
    })

    // ── Deals: one row each, status driven by the backend. ──
    balance?.movements?.deals?.forEach((deal, i) => {
        const rawDate = deal.startDate || deal.date || ''
        const formatted = formatStatus(deal.status, deal.eligibleDate)
        rows.push({
            id: `deal-${deal.retailerName ?? 'deal'}-${i}`,
            retailerName: deal.retailerDisplayName,
            date: rawDate ? formatRowDate(rawDate) : '',
            iconSrc: retailerIconBasePath
                ? `${retailerIconBasePath}${deal.retailerIconPath}`
                : '',
            iconBg: deal.retailerBackgroundColor || undefined,
            isClaim: false,
            amountDisplay: `${deal.tokenAmountDisplay ?? deal.tokenAmount}`,
            tokenSymbol: deal.tokenSymbol,
            status: formatted,
            rawStatus: statusKey(deal.status, formatted),
            description:
                deal.history?.map((h) =>
                    createDescription({ ...h, retailerName: deal.retailerDisplayName }),
                ) || [],
        })
    })

    return { rows, isLoading: query.isLoading }
}
