/**
 * Mobile portal balance block: Claimable + Pending cards and two helper
 * buttons. Pure UI — logic in useRewards. While the balance query loads, the
 * amounts/labels become greyed placeholder bars and the buttons are disabled.
 */
import Icon from '../Icon/Icon'
import { useRewards } from './useRewards'
import styles from './styles.mobile.module.css'

interface Props {
    /** Override the Claimable card's "Claim" click handler. */
    onClaim?: () => void
}

const Rewards = ({ onClaim }: Props) => {
    const {
        isLoading,
        claimableDisplay,
        claimableSymbol,
        pendingDisplay,
        pendingSymbol,
        canOpenClaim,
        belowMinimum,
        labels,
        goToHistory,
        goToFaq,
        openSupport,
    } = useRewards()

    return (
        <section className={styles.root} aria-label={labels.rewards}>
            <div className={styles.row}>
                {/* Claimable */}
                <div className={`${styles.card} ${isLoading ? styles.cardLoading : ''}`}>
                    {!isLoading && (
                        <Icon
                            name="tip-jar.svg"
                            className={styles.decoIcon}
                            aria-hidden="true"
                        />
                    )}
                    <div className={styles.cardBody}>
                        {isLoading ? (
                            <span className={`${styles.skeleton} ${styles.skeletonLabel}`} aria-hidden="true" />
                        ) : (
                            <p className={styles.label}>{labels.claimable}</p>
                        )}
                        <div className={styles.amountRow}>
                            {isLoading ? (
                                <>
                                    <span className={`${styles.skeleton} ${styles.skeletonAmount}`} aria-hidden="true" />
                                    <span className={`${styles.skeleton} ${styles.skeletonBtn}`} aria-hidden="true" />
                                </>
                            ) : (
                                <>
                                    <span className={styles.amount}>{claimableDisplay}
                                        {claimableSymbol ? ` ${claimableSymbol}` : null}
                                    </span>
                                    <button
                                        type="button"
                                        className={`${styles.claimBtn} ${belowMinimum ? styles.claimBtnDisabled : ''}`}
                                        onClick={onClaim}
                                        disabled={!canOpenClaim}
                                    >
                                        {labels.claim}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pending */}
                <div className={`${styles.card} ${isLoading ? styles.cardLoading : ''}`}>
                    {!isLoading && (
                        <Icon
                            name="hourglass.svg"
                            className={styles.decoIcon}
                            aria-hidden="true"
                        />
                    )}
                    <div className={styles.cardBody}>
                        {isLoading ? (
                            <span className={`${styles.skeleton} ${styles.skeletonLabel}`} aria-hidden="true" />
                        ) : (
                            <p className={styles.label}>{labels.pending}</p>
                        )}
                        <div className={styles.amountRow}>
                            {isLoading ? (
                                <>
                                    <span className={`${styles.skeleton} ${styles.skeletonAmount}`} aria-hidden="true" />
                                    <span className={`${styles.skeleton} ${styles.skeletonBtn}`} aria-hidden="true" />
                                </>
                            ) : (
                                <>
                                    <span className={styles.amount}>
                                        {pendingDisplay}
                                        {pendingSymbol ? ` ${pendingSymbol}` : null}
                                    </span>
                                    <button
                                        type="button"
                                        className={styles.pendingBtn}
                                        onClick={goToHistory}
                                        aria-label={labels.viewRewards}
                                    >
                                        <Icon
                                            name="arrow-right.svg"
                                            className={styles.pendingBtnIcon}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.helperRow}>
                <button
                    type="button"
                    className={`${styles.helperBtn} ${isLoading ? styles.helperBtnLoading : ''}`}
                    onClick={goToFaq}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className={`${styles.skeleton} ${styles.skeletonHelperBar}`} aria-hidden="true" />
                    ) : (
                        labels.needHelp
                    )}
                </button>
                <button
                    type="button"
                    className={`${styles.helperBtn} ${isLoading ? styles.helperBtnLoading : ''}`}
                    onClick={openSupport}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className={`${styles.skeleton} ${styles.skeletonHelperBar}`} aria-hidden="true" />
                    ) : (
                        labels.missingReward
                    )}
                </button>
            </div>
        </section>
    )
}

export default Rewards
