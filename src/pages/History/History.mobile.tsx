/*
 * More — bottom-sheet overlay. Holds the three help actions (Need Help?,
 * Missing Reward, What's This?) above the full reward history. The previous
 * page renders behind a darkening layer. Pure UI — logic in useHistoryPage.
 */
import MobileHeader from '../../components/Header/Header.mobile'
import MobileHistoryItem from '../../components/HistoryItem/HistoryItem.mobile'
import MobileHome from '../Home/Home.mobile'
import { useHistoryPage } from './useHistoryPage'
import styles from './styles.mobile.module.css'

const MobileHistory = () => {
    const {
        labels,
        rows,
        isLoading,
        openId,
        close,
        onToggle,
        goToFaq,
        openSupport,
    } = useHistoryPage()

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
                <MobileHeader title={labels.title} onClose={close} />
                <main className={styles.content}>
                    <div className={styles.actions}>
                        <button type="button" className={styles.actionBtn} onClick={goToFaq}>
                            {labels.needHelp}
                        </button>
                        <button type="button" className={styles.actionBtn} onClick={openSupport}>
                            {labels.missingReward}
                        </button>
                        <button type="button" className={styles.actionBtn} onClick={goToFaq}>
                            {labels.whatsThis}
                        </button>
                    </div>

                    <div className={styles.body}>
                        {isLoading ? null : rows.length === 0 ? (
                            <div className={styles.empty}>
                                <p className={styles.emptyText}>{labels.empty}</p>
                            </div>
                        ) : (
                            <>
                                <p className={styles.intro}>{labels.rewardHistory}</p>
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
                    </div>
                </main>
            </div>
        </div>
    )
}

export default MobileHistory
