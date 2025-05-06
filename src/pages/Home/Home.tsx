// Styles
import styles from './styles.module.css'
// Components
import Header from '../../components/Header/Header'
import Rewards from '../../components/Rewards/Rewards'
import Search from '../../components/Search/Search'
import Categories from '../../components/Categories/Categories'
import CardsList from '../../components/CardsList/CardsList'
// Hooks
import { useEffect, useRef, useState } from 'react'
import { useRouteLoaderData, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useInView } from 'framer-motion'
// Requests
import fetchRetailers from '../../api/fetchRetailers'
import getFilters from '../../api/getFilters'
import { useGoogleAnalytics } from '../../utils/hooks/useGoogleAnalytics'
import { useWalletAddress } from '../../utils/hooks/useWalletAddress'

const Home = () => {
    const { platform, isCountryAvailable, iconsPath, userId, flowId } = useRouteLoaderData('root') as LoaderData
    const { sendGaEvent } = useGoogleAnalytics()
    const [searchParams] = useSearchParams();
    const { walletAddress } = useWalletAddress()
    const country = searchParams.get('country')?.toUpperCase()
    const [search, setSearch] = useState<ReactSelectOptionType | null>(null)
    const [category, setCategory] = useState<Category | null>(null)
    const paginationRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const isVisible = useInView(paginationRef)

    const { data: categoriesSearch } = useQuery({
        queryFn: () => getFilters({ country, platform, user_id: userId, flow_id: flowId }),
        queryKey: ["categories-search"],
    })

    const {
        data: retailers,
        fetchNextPage,
        isFetching,
        isFetchingNextPage,
        isLoading: isLoadingRetailers,
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
        sendGaEvent('category_select', {
            category: 'user_action',
            action: 'click',
            details: category?.name
        })
    }

    const resetFilters = () => {
        setCategory(null)
        setSearch(null)
        scrollToTop()
        sendGaEvent("clear_selection", {
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
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={styles.filter}
                                        onClick={resetFilters}
                                    >
                                        <span>{search?.value || category?.name}</span>
                                        <img src={`${iconsPath}/x-mark-filter.svg`} alt="x-icon" />
                                    </motion.button>
                                    : null}
                            </AnimatePresence>
                        </div>
                        <div className={styles.deals_amount}>{
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
                />
                <div
                    className={styles.load}
                    ref={paginationRef}
                >{isFetchingNextPage ? "Loading..." : ''}</div>
            </main>
        </div>
    )
}

export default Home