/** Mobile portal hero "Cashback earned" card: total earned amount + USD
 * subtitle. Pure UI — logic in useCashbackEarned. */
import Icon from '../Icon/Icon'
import { useCashbackEarned } from './useCashbackEarned'
import styles from './styles.mobile.module.css'

const CashbackEarned = () => {
    const { labels, isLoading, RiveComponent, riveFailed, amountDisplay, symbol, usdDisplay } =
        useCashbackEarned()

    // Loading skeleton: neutral tile, placeholder bars, no fox.
    if (isLoading) {
        return (
            <section
                className={`${styles.root} ${styles.loading}`}
                aria-label={labels.cashbackEarned}
                aria-busy="true"
            >
                <div className={styles.body}>
                    <span
                        className={`${styles.skeleton} ${styles.skeletonLabel}`}
                        aria-hidden="true"
                    />
                    <div className={styles.skeletonAmountGroup}>
                        <span
                            className={`${styles.skeleton} ${styles.skeletonAmount}`}
                            aria-hidden="true"
                        />
                        <span
                            className={`${styles.skeleton} ${styles.skeletonSub}`}
                            aria-hidden="true"
                        />
                    </div>
                </div>
                <span
                    className={`${styles.skeleton} ${styles.skeletonDeco}`}
                    aria-hidden="true"
                />
            </section>
        )
    }

    return (
        <section
            className={styles.root}
            aria-label={labels.cashbackEarned}
        >
            <div className={styles.body}>
                <div className={styles.labelRow}>
                    <Icon
                        name="piggy-bank.svg"
                        className={styles.labelIcon}
                        aria-hidden="true"
                    />
                    <p className={styles.label}>
                        {labels.cashbackEarned}
                    </p>
                </div>
                <div className={styles.amountGroup}>
                    <p className={styles.amount}>
                        {amountDisplay}
                        {symbol ? ` ${symbol}` : null}
                    </p>
                    <p className={styles.sub}>
                        {labels.currentValue}: {usdDisplay}
                    </p>
                </div>
            </div>
            {!riveFailed && (
                <RiveComponent
                    className={styles.deco}
                    aria-hidden="true"
                />
            )}
        </section>
    )
}

export default CashbackEarned
