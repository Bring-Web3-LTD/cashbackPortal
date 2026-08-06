/** Mobile portal home page: hero + filter row (categories / search / chip) +
 * retailer list + claim modal. Pure UI — logic in useHomePage. */
import { useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MobileHeroSection from '../../components/HeroSection/HeroSection.mobile'
import MobileCategories from '../../components/Categories/Categories.mobile'
import MobileSearchBar from '../../components/Search/Search.mobile'
import MobileFilterChip from '../../components/FilterChip/FilterChip.mobile'
import MobileCardsList from '../../components/CardsList/CardsList.mobile'
import MobileClaimModal from '../../components/ClaimModal/ClaimModal.mobile'
import MobileCouponsToggle, { PortalView } from '../../components/CouponsToggle/CouponsToggle.mobile'
import MobileCouponsConnect from '../../components/CouponsConnect/CouponsConnect.mobile'
import { useHomePage } from './useHomePage'
import styles from './styles.mobile.module.css'

const MobileHome = () => {
    // Coupons/Cashback switcher - the feature is enabled when verify returned
    // couponsIframeSrc (initially via the loader, or later via SESSION_UPDATE;
    // mobile-only by construction: this page renders only on mobile). The live
    // src comes from the wallet context so each new verify replaces it; the
    // iframe mounts only with a connected wallet AND a current src - otherwise
    // the Coupons view shows a connect placeholder.
    const { couponsIframeSrc: initialCouponsIframeSrc } = useRouteLoaderData('root') as LoaderData
    const { t } = useTranslation()
    const [view, setView] = useState<PortalView>('cashback')
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
        couponsIframeSrc,
    } = useHomePage()

    const couponsEnabled = Boolean(initialCouponsIframeSrc || couponsIframeSrc)
    const showCoupons = couponsEnabled && view === 'coupons'

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
                {couponsEnabled && (
                    <MobileCouponsToggle value={view} onChange={setView} />
                )}
                {showCoupons ? (
                    walletAddress && couponsIframeSrc ? (
                        <iframe
                            className={styles.couponsFrame}
                            src={couponsIframeSrc}
                            title={t('coupons')}
                        />
                    ) : (
                        <MobileCouponsConnect />
                    )
                ) : (
                    <>
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
                    </>
                )}
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
