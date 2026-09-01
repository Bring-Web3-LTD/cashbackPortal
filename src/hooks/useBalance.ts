/**
 * React-Query hook that fetches the user's cashback balance via the
 * existing `/cache` endpoint.
 * Returns the raw query result. Callers derive eligible / pending fields
 * via `selectEligible` / `selectPending` so the projection logic lives
 * in one place.
 */
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useRouteLoaderData } from 'react-router-dom'
import fetchCache from '../api/fetchCache'
import { getMockCache } from '../api/mockCache'
import { useWalletAddress } from './useWalletAddress'

type BalanceResponse = Awaited<ReturnType<typeof fetchCache>>

export const useBalance = (): UseQueryResult<BalanceResponse> => {
    const { platform, userId, flowId } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    // Temporary — see api/mockCache.ts. Remove once /cache serves per-email data.
    const mock = getMockCache()

    return useQuery({
        queryFn: async () => {
            if (mock) return mock
            const body: Parameters<typeof fetchCache>[0] = { platform, userId, flowId }
            if (walletAddress) body.walletAddress = walletAddress
            return await fetchCache(body)
        },
        queryKey: ['balance', walletAddress, mock ? 'mock' : ''],
        enabled: !!mock || !!walletAddress,
        // A reward earned while the tab sat in the background only shows up on
        // the next fetch, and nothing pushes it to us — coming back to the
        // portal is the signal. Opted in here rather than globally (main.tsx
        // turns it off) because only the balance goes stale on its own.
        refetchOnWindowFocus: true,
    })
}

/** First eligible (claimable) token from the cache, or `undefined`. */
export const selectEligible = (data: BalanceResponse | undefined) =>
    data?.data?.eligible?.[0]

/** First pending token from the cache, or `undefined`. */
export const selectPending = (data: BalanceResponse | undefined) =>
    data?.data?.totalPendings?.[0]

/**
 * Aggregate "total earned" token (pending + claimable + claimed) from the
 * cache, or `undefined` if the backend doesn't provide it.
 */
export const selectTotalEarned = (data: BalanceResponse | undefined) =>
    data?.data?.totalEarned?.[0]

/**
 * True while the user has no rewards and no history at all. Read from the
 * query rather than the loader so it re-evaluates live — the post-claim
 * `invalidateQueries(['balance', …])` already refreshes it within the session.
 *
 * The backend flag alone isn't enough: it can still read `true` in a payload
 * that already carries a reward, which would strand the dashboard in the
 * first-time state. So the flag only holds while the rest of the response
 * agrees — the first reward drops it without waiting for the flag to catch up.
 */
export const selectFirstTimeUser = (data: BalanceResponse | undefined) => {
    const d = data?.data
    if (!d) return false
    const earned = (tokens: Token[] | undefined) => (tokens?.[0]?.tokenAmount ?? 0) > 0

    return d.firstTimeUser === true
        && !earned(d.eligible)
        && !earned(d.totalPendings)
        && !earned(d.totalEarned)
        && !d.movements?.deals?.length
        && !d.movements?.claims?.length
}
