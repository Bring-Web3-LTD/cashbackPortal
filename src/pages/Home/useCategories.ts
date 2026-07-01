/**
 * React-Query hook that fetches categories + search terms via the
 * existing `/categories-search` endpoint. Shares its query key with the
 * desktop Home page so both surfaces hit the same Tanstack cache entry.
 *
 * Returns the raw query result. Callers project via `selectCategories`
 * (the bit the mobile tabs row needs).
 */
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useRouteLoaderData, useSearchParams } from 'react-router-dom'
import getFilters from '../../api/getFilters'
import { useWalletAddress } from '../../hooks/useWalletAddress'

type FiltersResponse = Awaited<ReturnType<typeof getFilters>>

export const useCategories = (): UseQueryResult<FiltersResponse> => {
    const { platform, userId, flowId } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const [searchParams] = useSearchParams()
    const country = searchParams.get('country')?.toUpperCase()

    return useQuery({
        queryFn: async () => {
            const options: Parameters<typeof getFilters>[0] = {
                country,
                platform,
                user_id: userId,
                flow_id: flowId,
            }
            if (walletAddress) options.wallet_address = walletAddress
            return await getFilters(options)
        },
        queryKey: ['categories-search'],
    })
}

/** Convenience selector: just the list of `{ id, name }`. */
export const selectCategories = (
    data: FiltersResponse | undefined,
): { id: number; name: string }[] =>
    data?.categories?.items ?? []

/** Convenience selector: backend search term strings. */
export const selectSearchTerms = (data: FiltersResponse | undefined): string[] =>
    data?.searchTerms?.items ?? []
