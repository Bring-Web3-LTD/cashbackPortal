/** Generic mobile dashboard bar. Slots are driven by `firstTimeUser`,
 * `couponsEnabled` and `isHub`. Pure UI — logic in useDashboard. */
import Icon from '../Icon/Icon'
import { useDashboard, DashboardProps, DashboardMode } from './useDashboard'
import styles from './styles.mobile.module.css'

const TABS: DashboardMode[] = ['coupons', 'cashback']

const Dashboard = ({ mode, onModeChange, onClaim }: DashboardProps) => {
    const {
        firstTimeUser,
        couponsEnabled,
        isHub,
        pending,
        claim,
        labels,
        goToPending,
        goToMore,
        goToWhatsThis,
    } = useDashboard()

    return (
        <section className={styles.root} aria-label={labels.rewards}>
            {couponsEnabled ? (
                <div className={styles.tabs} role="tablist">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            role="tab"
                            aria-selected={mode === tab}
                            className={`${styles.tab} ${mode === tab ? styles.tabActive : ''}`}
                            onClick={() => onModeChange(tab)}
                        >
                            {labels[tab]}
                        </button>
                    ))}
                </div>
            ) : null}

            {firstTimeUser ? (
                <>
                    {isHub && !couponsEnabled ? (
                        <div className={styles.brand}>
                            <Icon
                                name="smart-cashback.svg"
                                className={styles.brandIcon}
                                aria-hidden="true"
                            />
                            <p className={styles.brandText}>{labels.smartCashback}</p>
                        </div>
                    ) : null}
                    {isHub ? null : (
                        <button type="button" className={`${styles.pill} ${styles.pillAccent}`}>
                            {labels.pairWallet}
                        </button>
                    )}
                    <button
                        type="button"
                        className={`${styles.pill} ${isHub ? styles.pillNarrow : ''}`}
                        onClick={goToWhatsThis}
                    >
                        {labels.whatsThis}
                    </button>
                </>
            ) : (
                <>
                    <button type="button" className={styles.tile} onClick={goToPending}>
                        <span className={styles.tileLabel}>{labels.pending}</span>
                        <span className={styles.tileValue}>
                            <span className={styles.amountRow}>
                                <span className={styles.amount}>{pending.amount}</span>
                                <span className={styles.symbol}>{pending.symbol}</span>
                            </span>
                            <span className={styles.usd}>{pending.usd}</span>
                        </span>
                    </button>
                    <button type="button" className={styles.tile} onClick={onClaim}>
                        <span className={styles.tileLabel}>{labels.claim}</span>
                        <span className={styles.tileValue}>
                            <span className={styles.amountRow}>
                                <span className={styles.amount}>{claim.amount}</span>
                                <span className={styles.symbol}>{claim.symbol}</span>
                            </span>
                            <span className={styles.usd}>≈ {claim.usd}</span>
                        </span>
                    </button>
                </>
            )}

            <button
                type="button"
                className={styles.iconBtn}
                onClick={goToMore}
                aria-label={labels.more}
            >
                <Icon
                    name={firstTimeUser ? 'chat.svg' : 'more-dots.svg'}
                    className={firstTimeUser ? styles.chatIcon : styles.moreIcon}
                    aria-hidden="true"
                />
            </button>
        </section>
    )
}

export default Dashboard
