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
 */
export const selectFirstTimeUser = (data: BalanceResponse | undefined) =>
    data?.data?.firstTimeUser === true
