/**
 * Logic hook for the desktop home page. Owns the retailers and filters
 * queries, the infinite scroll, the search/category filters, the coupons view
 * switch and the campaign-ended modal — so the page view is pure UI.
 *
 * Named for the surface because `useHomePage` is the mobile home's hook.
 */
import { useEffect, useRef, useState } from 'react'
import { useLocation, useRouteLoaderData, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInView } from 'framer-motion'
import { useRetailers } from '../../hooks/useRetailers'
import { useCategories } from './useCategories'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { useSkeletonPreview } from '../../hooks/useSkeletonPreview'
import { parseCampaignId } from '../../utils/campaigns'
import { ENV } from '../../config'
import type { PortalView } from '../../components/Dashboard/Dashboard'
import type { StatusModalState } from '../../components/Modals/StatusModal/StatusModal'

export const useHomeDesktop = () => {
    const { t } = useTranslation()
    const { isCountryAvailable, couponsEnabled } = useRouteLoaderData('root') as LoaderData
    const { sendAnalyticsEvent } = useAnalytics()
    const [searchParams] = useSearchParams()
    const { isTester, couponsIframeSrc } = useWalletAddress()
    const skeletonPreview = useSkeletonPreview()

    // Seeded from navigation state so the switcher still works on the pages
    // that show the dashboard but not the browse area.
    const routedView = (useLocation().state as { view?: PortalView } | null)?.view
    const [view, setView] = useState<PortalView>(routedView ?? 'cashback')
    const campaign = parseCampaignId(searchParams.get('campaignId'))

    const [search, setSearch] = useState<ReactSelectOptionType | null>(null)
    const [category, setCategory] = useState<Category | null>(null)
    const [isDemo, setIsDemo] = useState(false)
    const [campaignEndModalStatus, setCampaignEndModalStatus] = useState<'idle' | 'show' | 'shown'>('idle')
    const [isFirstLoadComplete, setIsFirstLoadComplete] = useState(false)
    const [testStatus, setTestStatus] = useState<StatusModalState | null>(null)

    const paginationRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const isVisible = useInView(paginationRef)

    const { data: categoriesSearch, isLoading: isLoadingCategories } = useCategories()

    const {
        data: retailers,
        fetchNextPage,
        isFetching,
        isFetchingNextPage,
        isLoading: isLoadingRetailers,
        isSuccess: isRetailersSuccess,
    } = useRetailers({ category, search })

    useEffect(() => {
        if (!isFetchingNextPage && isVisible) {
            fetchNextPage()
        }
    }, [isVisible, fetchNextPage, isFetchingNextPage])

    useEffect(() => {
        if (isRetailersSuccess && !isFirstLoadComplete && campaignEndModalStatus === 'idle') {
            setIsFirstLoadComplete(true)

            if (campaign && !retailers.pages[0].campaigns?.includes(campaign.id)) {
                setCampaignEndModalStatus('show')
            } else {
                setCampaignEndModalStatus('shown')
            }
        }
    }, [isRetailersSuccess, isFirstLoadComplete, campaignEndModalStatus, campaign, retailers?.pages])

    const scrollToTop = () => {
        if (!scrollRef?.current) return
        scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }

    const retailersList = retailers?.pages.flatMap((page) => page.items) ?? []
    const retailersMetadata = retailers?.pages[retailers.pages.length - 1]

    return {
        isCountryAvailable,
        isTester,
        isDemo,
        setIsDemo,
        view,
        setView,
        showCoupons: Boolean(couponsEnabled && couponsIframeSrc && view === 'coupons'),
        couponsIframeSrc,
        scrollRef,
        paginationRef,
        search,
        category,
        changeSearch: (searchTerm: ReactSelectOptionType) => {
            setSearch(searchTerm)
            setCategory(null)
            scrollToTop()
        },
        changeCategory: (cat: Category) => {
            setCategory(cat)
            setSearch(null)
            scrollToTop()
            sendAnalyticsEvent('category_select', {
                category: 'user_action',
                action: 'click',
                details: cat.name
            })
        },
        resetFilters: () => {
            setCategory(null)
            setSearch(null)
            scrollToTop()
            sendAnalyticsEvent("clear_selection", {
                category: "user_action",
                action: "click",
                details: search?.value ?? category?.name,
            })
        },
        retailersList,
        retailersMetadata,
        retailersLoading: (isFetching && !retailersList.length) || skeletonPreview,
        isFetchingNextPage,
        // The search row waits on the filters call, not the retailers one: that
        // call is what supplies its options, and it also feeds the chips beside
        // it, so the two resolve together.
        searchLoading: isLoadingCategories || skeletonPreview,
        categories: categoriesSearch?.categories?.items ?? [],
        searchTerms: categoriesSearch?.searchTerms?.items?.map((term) => ({
            value: term,
            label: term,
        })) ?? [],
        dealsCount: isLoadingRetailers
            ? "Searching for deals..."
            : `Showing ${retailersMetadata?.totalItems} deals`,
        campaignEndOpen: Boolean(campaign) && campaignEndModalStatus === 'show',
        dismissCampaignEnd: () => setCampaignEndModalStatus('shown'),
        // Drives the ?test=status preview, which opens StatusModal in any
        // state without running a claim. Non-production only, like the other
        // tester-facing affordances.
        statusPreview: ENV !== 'prod' && searchParams.get('test') === 'status',
        testStatus,
        setTestStatus,
        labels: {
            couponsTab: t('couponsTab'),
            loading: t('loading'),
        },
    }
}
