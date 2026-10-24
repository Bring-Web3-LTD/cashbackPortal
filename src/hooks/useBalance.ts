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
import { useWalletAddress } from './useWalletAddress'
import { useRequestIdentity } from './useRequestIdentity'

type BalanceResponse = Awaited<ReturnType<typeof fetchCache>>

export const useBalance = (): UseQueryResult<BalanceResponse> => {
    const { platform, flowId } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const { identity, isIdentified } = useRequestIdentity()

    return useQuery({
        queryFn: () => fetchCache({ platform, flowId, ...identity }),
        queryKey: ['balance', walletAddress],
        enabled: isIdentified,
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
 * Whether the user has no rewards and no history. Optimistically `true` until
 * /cache resolves, so onboarding shows first and is replaced once the backend
 * says the user already has activity.
 */
export const selectFirstTimeUser = (data: BalanceResponse | undefined) =>
    typeof data?.data?.firstTimeUser === 'boolean' ? data.data.firstTimeUser : true
