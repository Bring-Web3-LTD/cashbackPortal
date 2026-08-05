// Styles
import styles from './styles.module.css'
// Components
import Header from '../../components/Header/Header'
import Rewards from '../../components/Rewards/Rewards'
import Search from '../../components/Search/Search'
import Categories from '../../components/Categories/Categories'
import CardsList from '../../components/CardsList/CardsList'
import CampaignEndModal from '../../components/Modals/CampaignEndModal/CampaignEndModal'
// Rendered only by the ?test=status preview below.
import StatusModal from '../../components/Modals/StatusModal/StatusModal'
// Hooks
import { useEffect, useRef, useState } from 'react'
import { useRouteLoaderData, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useInView } from 'framer-motion'
// Requests
import fetchRetailers from '../../api/fetchRetailers'
import getFilters from '../../api/getFilters'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { parseCampaignId } from '../../utils/campaigns'
import Icon from '../../components/Icon/Icon'
import { ENV } from '../../config'

const Home = () => {
    const { platform, isCountryAvailable, userId, flowId } = useRouteLoaderData('root') as LoaderData
    const { sendAnalyticsEvent } = useAnalytics()
    const [searchParams] = useSearchParams();
    const { walletAddress, isTester } = useWalletAddress()
    const country = searchParams.get('country')?.toUpperCase()
    const campaign = parseCampaignId(searchParams.get('campaignId'))

    const [search, setSearch] = useState<ReactSelectOptionType | null>(null)
    const [category, setCategory] = useState<Category | null>(null)
    const [isDemo, setIsDemo] = useState(false)
    const [campaignEndModalStatus, setCampaignEndModalStatus] = useState<'idle' | 'show' | 'shown'>('idle')
    // Drives the ?test=status preview, which opens StatusModal in any state
    // without running a claim. Non-production only, like the other
    // tester-facing affordances.
    const [testStatus, setTestStatus] = useState<'success' | 'failure' | 'loading' | null>(null)
    const statusPreview = ENV !== 'prod' && searchParams.get('test') === 'status'
    const [isFirstLoadComplete, setIsFirstLoadComplete] = useState(false)

    const paginationRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const isVisible = useInView(paginationRef)

    const { data: categoriesSearch } = useQuery({
        queryFn: async () => {
            const options: Parameters<typeof getFilters>[0] = {
                country,
                platform,
                user_id: userId,
                flow_id: flowId
            }
            if (walletAddress) options.wallet_address = walletAddress
            return await getFilters(options)
        },
        queryKey: ["categories-search"],
    })

    const {
        data: retailers,
        fetchNextPage,
        isFetching,
        isFetchingNextPage,
        isLoading: isLoadingRetailers,
        isSuccess: isRetailersSuccess,
    } = useInfiniteQuery({
        queryKey: ["retailers", category, search],
        queryFn: async ({ pageParam }) => {
            const options: Parameters<typeof fetchRetailers>[0] = {
                type: "all",
                pageSize: 40,
                page: typeof pageParam === "number" ? pageParam : undefined,
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
        getNextPageParam: (lastPage) => {
            return lastPage.nextPageNumber
        },
        initialPageParam: 0,
    })

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
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    const changeSearch = (searchTerm: ReactSelectOptionType) => {
        setSearch(searchTerm)
        setCategory(null)
        scrollToTop()
    }

    const changeCategory = (cat: Category) => {
        setCategory(cat)
        setSearch(null)
        scrollToTop()
        sendAnalyticsEvent('category_select', {
            category: 'user_action',
            action: 'click',
            details: cat.name
        })
    }

    const resetFilters = () => {
        setCategory(null)
        setSearch(null)
        scrollToTop()
        sendAnalyticsEvent("clear_selection", {
            category: "user_action",
            action: "click",
            details: search?.value ?? category?.name,
        })
    }

    const retailersList = retailers?.pages.flatMap((page) => page.items) ?? []
    const retailersMetadata = retailers?.pages[retailers.pages.length - 1]
    const categories = categoriesSearch?.categories?.items ?? []
    const searchTerms =
        categoriesSearch?.searchTerms?.items?.map((term) => ({
            value: term,
            label: term,
        })) ?? []

    if (isCountryAvailable === false) {
        return (
            <div className={styles.not_available_container}>
                <h1 className={styles.not_available}>
                    This service is not available in your country for now.
                </h1>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {/* Claim status-modal preview: reach it at ?test=status, or tick
                "Status modal preview" in the dev wrapper. The flag does nothing
                on a production build. */}
            {statusPreview ? (
                <>
                    <div style={{
                        position: 'fixed', top: 12, left: 12, zIndex: 20,
                        display: 'flex', gap: 6, padding: 6, borderRadius: 10,
                        background: 'rgba(0, 0, 0, 0.55)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(4px)',
                    }}>
                        {(['failure', 'success', 'loading'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setTestStatus(s)}
                                style={{
                                    padding: '5px 12px', borderRadius: 100, cursor: 'pointer',
                                    font: '500 12px/1 Inter, sans-serif', letterSpacing: .2,
                                    textTransform: 'capitalize',
                                    color: testStatus === s ? '#0B0B0B' : '#F5F8FF',
                                    background: testStatus === s ? '#F5F8FF' : 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.16)',
                                }}
                            >{s}</button>
                        ))}
                    </div>
                    <StatusModal
                        open={testStatus !== null}
                        status={testStatus ?? 'loading'}
                        closeFn={() => setTestStatus(null)}
                    />
                </>
            ) : null}
            {isTester ?
                <label htmlFor="is-demo" className={styles.test_label}>
                    <span>Demo store</span>
                    <input
                        type="checkbox"
                        id="is-demo"
                        className={styles.test_checkbox}
                        checked={isDemo}
                        onChange={e => setIsDemo(e.target.checked)}
                    />
                </label>
                : null}
            <Header />
            <main ref={scrollRef} className={styles.main}>
                <Rewards />
                <div className={styles.filters_section}>
                    <div className={styles.search_section}>
                        <div className={styles.search_container}>
                            <Search
                                options={searchTerms}
                                value={search}
                                onChangeFn={(item) => changeSearch(item)}
                            />
                            <AnimatePresence>
                                {search?.value || category?.name ?
                                    <motion.button
                                        id="home-filter-reset-btn"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={styles.filter}
                                        onClick={resetFilters}
                                    >
                                        <span>{search?.value || category?.name}</span>
                                        <Icon name="x-mark-filter.svg" alt="x-icon" />
                                    </motion.button>
                                    : null}
                            </AnimatePresence>
                        </div>
                        <div id="deals-amount" className={styles.deals_amount}>{
                            isLoadingRetailers ? "Searching for deals..." :
                                `Showing ${retailersMetadata?.totalItems} deals`
                        }</div>
                    </div>
                    <Categories
                        categories={categories}
                        category={category}
                        onClickFn={(cat) => changeCategory(cat)}
                    />
                </div>
                <CardsList
                    loading={isFetching && !retailersList.length}
                    retailers={retailersList}
                    metadata={retailersMetadata}
                    search={search}
                    isDemo={isDemo}
                />
                <div
                    className={styles.load}
                    ref={paginationRef}
                >{isFetchingNextPage ? "Loading..." : ''}</div>
            </main>
            <CampaignEndModal
                open={Boolean(campaign) && campaignEndModalStatus === 'show'}
                closeFn={() => setCampaignEndModalStatus('shown')}
            />
        </div>
    )
}

export default Home