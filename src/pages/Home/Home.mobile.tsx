/** Mobile portal home page: hero + filter row (categories / search / chip) +
 * retailer list + claim modal. Pure UI — logic in useHomePage. */
import MobileHeroSection from '../../components/HeroSection/HeroSection.mobile'
import MobileCategories from '../../components/Categories/Categories.mobile'
import MobileSearchBar from '../../components/Search/Search.mobile'
import MobileFilterChip from '../../components/FilterChip/FilterChip.mobile'
import MobileCardsList from '../../components/CardsList/CardsList.mobile'
import MobileClaimModal from '../../components/ClaimModal/ClaimModal.mobile'
import { useHomePage } from './useHomePage'
import styles from './styles.mobile.module.css'

const MobileHome = () => {
    const {
        category,
        setCategory,
        searchOpen,
        setSearchOpen,
        searchTyping,
        setSearchTyping,
        searchChip,
        isSearching,
        suggestions,
        showDropdown,
        showNoResults,
        handleCloseSearch,
        handleSelectSuggestion,
        handleClearSearchChip,
        categories,
        isLoadingCategories,
        retailers,
        metadata,
        isLoadingRetailers,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        claimState,
        currentCryptoSymbol,
        claimDisplay,
        claimAmount,
        minimumClaimThreshold,
        walletAddress,
        walletName,
        walletEmoji,
        claimExplorerLink,
        handleOpenClaim,
        handleCloseClaim,
        handleConfirmClaim,
    } = useHomePage()

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
            <main className={styles.content}>
                <MobileHeroSection onClaim={handleOpenClaim} />
                {renderFilterRow()}
                <MobileCardsList
                    retailers={retailers}
                    metadata={metadata}
                    isLoading={isLoadingRetailers}
                    isFetchingNextPage={isFetchingNextPage}
                    hasNextPage={Boolean(hasNextPage)}
                    onFetchNextPage={fetchNextPage}
                    isSearching={isSearching}
                />
            </main>
            <MobileClaimModal
                state={claimState}
                tokenSymbol={currentCryptoSymbol}
                tokenAmountDisplay={claimDisplay}
                tokenAmount={claimAmount}
                minimumClaimThreshold={minimumClaimThreshold}
                walletAddress={walletAddress}
                walletName={walletName}
                walletEmoji={walletEmoji}
                explorerLink={claimExplorerLink}
                onClose={handleCloseClaim}
                onConfirm={handleConfirmClaim}
                onTryAgain={handleConfirmClaim}
            />
        </div>
    )
}

export default MobileHome
