/**
 * TEMPORARY — dev-only mock of the /cache response so the dashboard, Pending
 * and More designs can be reviewed before the backend serves history/rewards
 * per email. Never active on a production build.
 *
 * Enable with a URL param, read once at boot. Through the dev-wrapper put it on
 * the wrapper's own URL — it forwards the param to the iframe.
 *   ?mock=full   every status + claims aggregate, non-empty balances
 *   ?mock=empty  no movements, zero balances — empty states
 *   ?mock=first  firstTimeUser, no movements — first-time dashboard states
 *
 * No wrapper / no wallet needed in dev mode:
 *   yarn dev → http://localhost:5173/pending?platform=NIGHTLY&mock=full
 *   (mobile portal needs a narrow viewport — 375px for SOLFLARE, 360px otherwise)
 *
 * Delete this file and the three `mock` lines in hooks/useBalance.ts once the
 * endpoint exists.
 */
import fetchCache from './fetchCache'
import { ENV } from '../config'

type CacheResponse = Awaited<ReturnType<typeof fetchCache>>

const token = (over: Partial<Token> = {}): Token => ({
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    tokenAmount: 0,
    tokenAmountDisplay: '0.00',
    minimumClaimThreshold: 0.1,
    tokenIconPath: '',
    tokenInUsd: 1,
    totalEstimatedUsd: 0,
    ...over,
})

const deal = (over: Partial<Deal> = {}): Deal => ({
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    tokenAmount: 0.021,
    tokenAmountDisplay: '0.021',
    startDate: '2026-05-07T10:00:00.000Z',
    eligibleDate: '2026-09-07T10:00:00.000Z',
    status: 'pending',
    retailerName: 'aliexpress',
    retailerDisplayName: 'AliExpress',
    // Real media host + path shape, so the rows show the actual logos.
    retailerIconPath: '/aliexpress.png',
    retailerBackgroundColor: '#e62c02',
    tokenIconPath: '',
    tokenInUsd: 1,
    totalEstimatedUsd: 0.021,
    history: [],
    ...over,
})

/** Two-step history → the row becomes expandable. */
const history = (amount: number): HistoryItem[] => [
    {
        date: '2025-12-08T10:00:00.000Z',
        action: 'PURCHASE_POSTED',
        tokenAmount: amount,
        tokenSymbol: 'USDC',
    },
    {
        date: '2026-01-08T10:00:00.000Z',
        action: 'PURCHASE_APPROVED',
        tokenAmount: amount,
        tokenSymbol: 'USDC',
    },
]

/** Real retailers from /retailers, so logos + brand colours resolve. */
const at = (name: string, display: string, bg = ''): Partial<Deal> => ({
    retailerName: name,
    retailerDisplayName: display,
    retailerIconPath: `/${name}.png`,
    retailerBackgroundColor: bg,
})

const deals: Deal[] = [
    // ── pending (grey pill) — the ones with `history` are expandable ──
    deal({ history: history(1.0778) }),
    deal({ ...at('nordvpn', 'NordVPN'), startDate: '2026-06-11T10:00:00.000Z', tokenAmount: 3.4, tokenAmountDisplay: '3.4', totalEstimatedUsd: 3.4 }),
    deal({ ...at('stockx', 'StockX', '#ffffff'), startDate: '2026-07-02T10:00:00.000Z', tokenAmount: 0.5, tokenAmountDisplay: '0.5', totalEstimatedUsd: 0.5, history: history(0.5) }),
    // No icon → initials fallback (2 letters) + name truncation.
    deal({ retailerName: 'long', retailerDisplayName: 'Very Long Retailer Name Ltd', retailerIconPath: '', startDate: '2026-07-28T10:00:00.000Z', tokenAmount: 128.4567, tokenAmountDisplay: '128.4567', totalEstimatedUsd: 128.46 }),

    // ── completed → shown as "Claimable" ──
    deal({ status: 'completed', startDate: '2026-03-14T10:00:00.000Z', tokenAmount: 0.021, history: history(0.021) }),
    deal({ ...at('upwork', 'Upwork', '#14A800'), status: 'completed', startDate: '2026-04-05T10:00:00.000Z', tokenAmount: 7.25, tokenAmountDisplay: '7.25', totalEstimatedUsd: 7.25 }),

    // ── cancelled (red pill) ──
    deal({ status: 'cancelled', startDate: '2026-02-19T10:00:00.000Z', tokenAmount: 0.021 }),
    deal({ ...at('temo', 'TEMU', '#fc7701'), status: 'cancelled', startDate: '2026-01-30T10:00:00.000Z', tokenAmount: 2.1, tokenAmountDisplay: '2.1', totalEstimatedUsd: 2.1, history: history(2.1) }),

    // ── claimed (green pill) ──
    deal({ status: 'claimed', startDate: '2025-12-22T10:00:00.000Z', tokenAmount: 0.021 }),
    deal({ ...at('ebay', 'eBay'), status: 'claimed', startDate: '2025-11-08T10:00:00.000Z', tokenAmount: 4.8, tokenAmountDisplay: '4.8', totalEstimatedUsd: 4.8, history: history(4.8) }),
]

/** Aggregated by the hook into the single "Total claims" row (gift avatar). */
const claims: Claim[] = [
    {
        action: 'CLAIM',
        date: '2026-04-02T10:00:00.000Z',
        tokenAmount: 0.015,
        tokenAmountDisplay: '0.015',
        tokenSymbol: 'USDC',
        txid: '5Kd3NBUAdUnhyzenEwVLy9pBKxSwXvE9FprzrTuYAoUuAqPr',
    },
    {
        action: 'CLAIM',
        date: '2026-06-19T10:00:00.000Z',
        tokenAmount: 0.006,
        tokenAmountDisplay: '0.006',
        tokenSymbol: 'USDC',
    },
]

const base = (data: CacheResponse['data']): CacheResponse => ({
    tokenIconBasePath: '',
    retailerIconBasePath: 'https://media.bringweb3.io/retailers',
    data,
})

const VARIANTS: Record<string, CacheResponse> = {
    full: base({
        eligible: [token({ tokenAmount: 25.25, tokenAmountDisplay: '25.25', totalEstimatedUsd: 25.25 })],
        totalPendings: [token({ tokenAmount: 132.4777, tokenAmountDisplay: '132.4777', totalEstimatedUsd: 132.48 })],
        totalEarned: [token({ tokenAmount: 157.75, tokenAmountDisplay: '157.75', totalEstimatedUsd: 157.75 })],
        movements: { claims, deals },
        firstTimeUser: false,
    }),
    empty: base({
        eligible: [token()],
        totalPendings: [token()],
        totalEarned: [token()],
        movements: { claims: [], deals: [] },
        firstTimeUser: false,
    }),
    first: base({
        eligible: [token()],
        totalPendings: [token()],
        totalEarned: [token()],
        movements: { claims: [], deals: [] },
        firstTimeUser: true,
    }),
}

// Captured at boot — in-app navigation drops the query string.
// Case-insensitive: `?mock=First` is the same as `?mock=first`.
const requested = ENV === 'prod'
    ? null
    : new URLSearchParams(window.location.search).get('mock')?.toLowerCase() ?? null

// An unknown name used to fall back to `full` in silence, which reads as
// "the mock is broken" rather than "you typo'd the variant". Say so loudly.
if (requested && !VARIANTS[requested]) {
    console.error(
        `[mockCache] unknown variant "${requested}" — expected one of ${Object.keys(VARIANTS).join(' | ')}. Serving "full".`,
    )
} else if (requested) {
    console.info(`[mockCache] serving "${requested}" instead of /cache`)
}

/** The requested mock variant, or `null` when mocking is off/unavailable. */
export const getMockCache = (): CacheResponse | null =>
    requested ? (VARIANTS[requested] ?? VARIANTS.full) : null
