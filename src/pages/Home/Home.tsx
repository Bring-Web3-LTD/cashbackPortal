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
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useInView } from 'framer-motion'
// Requests
import fetchRetailers from '../../api/fetchRetailers'
import getFilters from '../../api/getFilters'

const Home = () => {
    const [search, setSearch] = useState<ReactSelectOptionType | null>(null)
    const [category, setCategory] = useState<Category | null>(null)
    const paginationRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const isVisible = useInView(paginationRef)

    const { data: categoriesSearch } = useQuery({
        queryFn: () => getFilters(),
        queryKey: ["categories-search"],
        // enabled: !!isAvailable?.isAvailable,
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
                pageSize: 25,
                page: typeof pageParam === "number" ? pageParam : undefined,
            }
            //   if (queryParams.country)
            //     options.country = queryParams.country.toUpperCase()
            if (category?.id) options.category = category.id
            if (search?.value) options.search = search.value
            return await fetchRetailers(options)
        },
        getNextPageParam: (lastPage) => {
            return lastPage.nextPageNumber
        },
        // enabled: !!isAvailable?.isAvailable,
        initialPageParam: 0,
    })

    useEffect(() => {
        if (!isFetchingNextPage && isVisible) {
            fetchNextPage()
        }
    }, [isVisible])

    const scrollToTop = () => {
        if (scrollRef.current) {
            console.log('here');

            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    const changeSearch = (searchTerm: ReactSelectOptionType) => {
        scrollToTop()
        setSearch(searchTerm)
        setCategory(null)
    }

    const changeCategory = (cat: Category) => {
        scrollToTop()
        setCategory(cat)
        setSearch(null)
    }

    const resetFilters = () => {
        scrollToTop()
        setCategory(null)
        setSearch(null)
    }

    const retailersList = retailers?.pages.flatMap((page) => page.items) ?? []
    const retailersMetadata = retailers?.pages[retailers.pages.length - 1]
    const categories = categoriesSearch?.categories?.items ?? []
    const searchTerms =
        categoriesSearch?.searchTerms?.items?.map((term) => ({
            value: term,
            label: term,
        })) ?? []

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
                                        <img src="/icons/x-mark.svg" alt="x-icon" />
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