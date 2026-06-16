/**
 * React-Query hook for the `/faq` endpoint.
 *
 * Mirrors the desktop FAQ cache key (`['faq', walletAddress, platform]`) so
 * the mobile and desktop surfaces share the same Tanstack cache entry. The
 * hook only deals with data; the MobileFaq page is responsible for rendering.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useRouteLoaderData } from 'react-router-dom'
import fetchFaq from '../../api/fetchFaq'
import { useWalletAddress } from '../../hooks/useWalletAddress'

type FaqResponse = Awaited<ReturnType<typeof fetchFaq>>

export const useFaq = (): UseQueryResult<FaqResponse> => {
    const { platform, userId, flowId } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()

    return useQuery({
        queryKey: ['faq', walletAddress, platform],
        queryFn: () => fetchFaq({ walletAddress: walletAddress ?? undefined, platform, userId, flowId }),
    })
}
