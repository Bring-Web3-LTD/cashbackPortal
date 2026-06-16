/*
 * Mobile History — bottom-sheet overlay.
 *
 * Presented as a modal sheet anchored to the bottom: the previous page
 * (Home) renders behind a darkening layer, and the History sheet slides
 * up leaving an ~88px gap at the top so the darkened page peeks through.
 * Rounded top corners + 1px border per the design. Pure UI — logic in
 * useHistoryPage.
 */
import MobileHeader from '../../components/Header/Header.mobile'
import MobileHistoryItem from '../../components/HistoryItem/HistoryItem.mobile'
import MobileHome from '../Home/Home.mobile'
import { useHistoryPage } from './useHistoryPage'
import styles from './styles.mobile.module.css'

const SKELETON_COUNT = 8

const MobileHistory = () => {
    const { t, rows, isLoading, openId, close, onToggle } = useHistoryPage()

    return (
        <div className={styles.root} data-testid="mobile-history">
            {/* Previous page, rendered behind and made inert. */}
            <div className={styles.behind} aria-hidden="true">
                <MobileHome />
            </div>

            {/* Darkening layer over the previous page. */}
            <div className={styles.darken} aria-hidden="true" onClick={close} />

            {/* Bottom-sheet overlay. */}
            <div className={styles.sheet} role="dialog" aria-modal="true">
                <MobileHeader
                    title={t('historyTitle') || 'History'}
                    onClose={close}
                />
                <main className={styles.content}>
                    {!isLoading && rows.length === 0 ? (
                        <div className={styles.empty}>
                            <p className={styles.emptyText}>
                                {t('emptyHistory') || 'No reward history found.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {isLoading ? (
                                <>
                                    <div className={styles.list} aria-hidden="true">
                                        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                                            <div key={i} className={styles.skeletonItem}>
                                                <div className={styles.skeletonAvatar} />
                                                <div className={styles.skeletonBody}>
                                                    <div className={styles.skeletonBar1} />
                                                    <div className={styles.skeletonBar2} />
                                                </div>
                                                <div className={styles.skeletonRight} />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                <p className={styles.intro}>
                                    {t('rewardHistory') || 'Reward history'}
                                </p>
                                <div className={styles.list}>
                                    {rows.map((row) => (
                                        <MobileHistoryItem
                                            key={row.id}
                                            row={row}
                                            isOpen={openId === row.id}
                                            onToggle={() => onToggle(row.id)}
                                        />
                                    ))}
                                </div>
                                </>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}

export default MobileHistory
