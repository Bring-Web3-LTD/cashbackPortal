/**
 * React-Query infinite hook that paginates the `/retailers` endpoint.
 *
 * Mirrors the desktop Home cache key so the two surfaces share the same
 * Tanstack cache. The hook only deals with data; the MobileCardsList
 * component is responsible for wiring `fetchNextPage` to a scroll
 * sentinel.
 */
import { useInfiniteQuery, type UseInfiniteQueryResult, type InfiniteData } from '@tanstack/react-query'
import { useRouteLoaderData, useSearchParams } from 'react-router-dom'
import fetchRetailers from '../api/fetchRetailers'
import { useWalletAddress } from '../utils/hooks/useWalletAddress'

type RetailersPage = Awaited<ReturnType<typeof fetchRetailers>>

export interface RetailersMetadata {
    iconQueryParam: string
    generalTermsUrl: string
    topGeneralTermsUrl: string
    retailerIconBasePath: string
    retailerTermsBasePath: string
}

interface UseRetailersOptions {
    category: Category | null
    search?: ReactSelectOptionType | null
}

export const useRetailers = (
    { category, search = null }: UseRetailersOptions,
): UseInfiniteQueryResult<InfiniteData<RetailersPage, number>> => {
    const { platform, userId, flowId } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const [searchParams] = useSearchParams()
    const country = searchParams.get('country')?.toUpperCase()

    return useInfiniteQuery({
        queryKey: ['retailers', category, search],
        queryFn: async ({ pageParam }) => {
            const options: Parameters<typeof fetchRetailers>[0] = {
                type: 'all',
                pageSize: 40,
                page: typeof pageParam === 'number' ? pageParam : undefined,
                platform,
                flowId,
                userId,
            }
            if (walletAddress) options.walletAddress = walletAddress
            if (country) options.country = country
            if (category?.id) options.category = category.id
            if (search?.value) options.search = search.value
            return await fetchRetailers(options)
        },
        getNextPageParam: (lastPage) => lastPage.nextPageNumber,
        initialPageParam: 0,
    })
}

/** Flatten paginated retailers into a single list. */
export const selectRetailers = (
    data: InfiniteData<RetailersPage, number> | undefined,
): Retailer[] => data?.pages.flatMap((p) => p.items) ?? []

/** Pull list-level metadata (icon base path etc.) from the last page. */
export const selectRetailersMetadata = (
    data: InfiniteData<RetailersPage, number> | undefined,
): RetailersMetadata | undefined => {
    const last = data?.pages[data.pages.length - 1]
    if (!last) return undefined
    return {
        iconQueryParam: last.iconQueryParam,
        generalTermsUrl: last.generalTermsUrl,
        topGeneralTermsUrl: last.topGeneralTermsUrl,
        retailerIconBasePath: last.retailerIconBasePath,
        retailerTermsBasePath: last.retailerTermsBasePath,
    }
}
