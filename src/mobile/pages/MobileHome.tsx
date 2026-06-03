import { useState } from 'react'
import MobileHeader from '../components/MobileHeader/MobileHeader'
import MobileCashbackEarned from '../components/MobileCashbackEarned/MobileCashbackEarned'
import MobileRewards from '../components/MobileRewards/MobileRewards'
import MobileCategories, { MobileCategoriesItem } from '../components/MobileCategories/MobileCategories'
import MobileSearchBar from '../components/MobileSearchBar/MobileSearchBar'
import MobileFilterChip from '../components/MobileFilterChip/MobileFilterChip'
import MobileCardsList from '../components/MobileCardsList/MobileCardsList'
import { useCategories, selectCategories } from '../hooks/useCategories'
import { useRetailers, selectRetailers, selectRetailersMetadata } from '../hooks/useRetailers'
import { computeSuggestions } from '../../utils/computeSuggestions'
import styles from './MobileHome.module.css'

const MobileHome = () => {
    const [category, setCategory] = useState<MobileCategoriesItem | null>(null)
    const [searchOpen, setSearchOpen] = useState(false)
    // Text currently typed in the input — drives the autocomplete dropdown only.
    const [searchTyping, setSearchTyping] = useState('')
    // Committed search value — drives the API filter and the chip display.
    const [searchChip, setSearchChip] = useState<string | null>(null)

    const { data: filters, isLoading: isLoadingCategories } = useCategories()
    const categories = selectCategories(filters)

    // Only the committed chip filters the API. The typed query
    // drives the autocomplete dropdown via local filtering of the already-
    // loaded retailer list — so typing "ali" instantly surfaces "AliExpress",
    // "Alibaba.com", etc. without a server round-trip.
    const trimmedTyping = searchTyping.trim()
    const search: ReactSelectOptionType | null = searchChip
        ? { value: searchChip, label: searchChip }
        : null

    const {
        data: retailersData,
        isLoading: isLoadingRetailers,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useRetailers({ category, search })
    const retailers = selectRetailers(retailersData)
    const metadata = selectRetailersMetadata(retailersData)

    // Autocomplete suggestions: two-pass local filter — first names that
    // start with the query, then word-boundary matches (so "express" still
    // surfaces "AliExpress"). De-duped, case-insensitive.
    const suggestions = computeSuggestions(retailers, searchOpen ? trimmedTyping : '')

    const showDropdown = searchOpen && trimmedTyping.length > 0
    // Only show the empty state once retailers have loaded AND no local match
    // was found — otherwise we'd flash "No matches" before the list arrives.
    const showNoResults =
        showDropdown && !isLoadingRetailers && retailers.length > 0 && suggestions.length === 0

    const handleCloseSearch = () => {
        setSearchTyping('')
        setSearchOpen(false)
    }

    const handleSelectSuggestion = (name: string) => {
        setSearchChip(name)
        setSearchTyping('')
        setSearchOpen(false)
    }

    const handleClearSearchChip = () => {
        setSearchChip(null)
    }

    // Decide what occupies the tabs-row slot. Priority: open input >
    // committed search chip > category chip > full categories row.
    const renderFilterRow = () => {
        if (searchOpen) {
            return (
                <MobileSearchBar
                    value={searchTyping}
                    onChange={setSearchTyping}
                    onClose={handleCloseSearch}
                    suggestions={suggestions}
                    onSelectSuggestion={handleSelectSuggestion}
                    showDropdown={showDropdown}
                    showNoResults={showNoResults}
                />
            )
        }
        if (searchChip) {
            return <MobileFilterChip label={searchChip} onClear={handleClearSearchChip} />
        }
        if (category) {
            return <MobileFilterChip label={category.name} onClear={() => setCategory(null)} />
        }
        return (
            <MobileCategories
                categories={categories}
                selectedId={null}
                isLoading={isLoadingCategories}
                onSelect={setCategory}
                onSearchClick={() => setSearchOpen(true)}
            />
        )
    }

    return (
        <div className={styles.root} data-testid="mobile-home">
            <MobileHeader hideBack />
            <main className={styles.content}>
                <MobileCashbackEarned />
                <MobileRewards />
                {renderFilterRow()}
                <MobileCardsList
                    retailers={retailers}
                    metadata={metadata}
                    isLoading={isLoadingRetailers}
                    isFetchingNextPage={isFetchingNextPage}
                    hasNextPage={Boolean(hasNextPage)}
                    onFetchNextPage={fetchNextPage}
                />
            </main>
        </div>
    )
}

export default MobileHome
