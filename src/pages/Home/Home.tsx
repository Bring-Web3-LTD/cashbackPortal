/**
 * Desktop home page: the dashboard, the search and category filters, then the
 * retailer grid with its infinite scroll.
 * Pure UI — logic in useHomeDesktop.
 */
// Styles
import styles from './styles.module.css'
// Components
import Dashboard from '../../components/Dashboard/Dashboard'
import Search from '../../components/Search/Search'
import Categories from '../../components/Categories/Categories'
import CardsList from '../../components/CardsList/CardsList'
// Rendered only by the ?test=status preview below.
import StatusModal from '../../components/Modals/StatusModal/StatusModal'
import Icon from '../../components/Icon/Icon'
import { useHomeDesktop } from './useHomeDesktop'

const Home = () => {
    const {
        isCountryAvailable,
        isTester,
        isDemo,
        setIsDemo,
        view,
        setView,
        showCoupons,
        couponsIframeSrc,
        paginationRef,
        search,
        category,
        changeSearch,
        changeCategory,
        resetFilters,
        retailersList,
        retailersMetadata,
        retailersLoading,
        isFetchingNextPage,
        searchLoading,
        categories,
        searchTerms,
        dealsCount,
        statusPreview,
        testStatus,
        setTestStatus,
        labels,
    } = useHomeDesktop()

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
                        {(['failure', 'success', 'loading', 'paired', 'pairFailed', 'claim'] as const).map(s => (
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
                        amount="25.25 USDC"
                        usdValue="$25.25"
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
            <main className={styles.main}>
                <Dashboard view={view} onViewChange={setView} />
                {showCoupons ? (
                    <iframe
                        id="coupons-frame"
                        className={styles.coupons_frame}
                        src={couponsIframeSrc}
                        title={labels.couponsTab}
                    />
                ) : (<>
                <div className={styles.filters_section}>
                    {searchLoading ? (
                        <div className={styles.search_section} aria-hidden="true">
                            <span className={`${styles.search_skeleton} skeleton_shimmer`} />
                        </div>
                    ) : (
                    <div className={styles.search_section}>
                        <div className={styles.search_container}>
                            <Search
                                options={searchTerms}
                                value={search}
                                onChangeFn={changeSearch}
                            />
                            {/* No entry animation: the chip is the direct answer
                                to the click that created it, so a fade only
                                delays it - and under StrictMode the remount
                                replayed it as a blink. */}
                            {search?.value || category?.name ?
                                <button
                                    id="home-filter-reset-btn"
                                    className={styles.filter}
                                    onClick={resetFilters}
                                >
                                    <span>{search?.value || category?.name}</span>
                                    <Icon name="x-mark-filter.svg" alt="" />
                                </button>
                                : null}
                        </div>
                        <div id="deals-amount" className={styles.deals_amount}>{dealsCount}</div>
                    </div>
                    )}
                    <Categories
                        categories={categories}
                        category={category}
                        onClickFn={changeCategory}
                    />
                </div>
                <CardsList
                    loading={retailersLoading}
                    retailers={retailersList}
                    metadata={retailersMetadata}
                    search={search}
                    isDemo={isDemo}
                />
                <div
                    className={styles.load}
                    ref={paginationRef}
                >{isFetchingNextPage ? labels.loading : ''}</div>
                </>)}
            </main>
        </div>
    )
}

export default Home
