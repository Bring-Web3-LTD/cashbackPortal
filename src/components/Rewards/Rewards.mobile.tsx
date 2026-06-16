/**
 * Mobile portal balance block.
 * Data comes from the shared `useBalance` query (same cache key as the
 * desktop Rewards component).
 *
 * Skeleton state: while the balance query is loading, the amount + sub
 * label are replaced with greyed-out placeholder bars and the action
 * buttons are disabled.
 */
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../Icon/Icon'
import { useBalance, selectEligible, selectPending } from '../../hooks/useBalance'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { ENV } from '../../config'
import styles from './styles.mobile.module.css'

interface Props {
    /** Override the Claimable card's "Claim" click handler. */
    onClaim?: () => void
}

const Rewards = ({ onClaim }: Props) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { platform, cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const { data, isLoading } = useBalance()
    const supportUrl = `https://support.bring.network/?platform=${platform}&address=${walletAddress ?? ''}&env=${ENV}`

    const eligible = selectEligible(data)
    const pending = selectPending(data)

    // Fall back to "0.00" when no balance row yet (e.g. no wallet connected).
    const fallbackSymbol = cryptoSymbols?.[0] ?? ''
    const claimableDisplay = eligible?.tokenAmountDisplay ?? '0.00'
    const claimableSymbol = eligible?.tokenSymbol ?? fallbackSymbol
    const pendingDisplay = pending?.tokenAmountDisplay ?? '0.00'
    const pendingSymbol = pending?.tokenSymbol ?? fallbackSymbol

    const canOpenClaim = !!eligible && eligible.tokenAmount > 0

    // Below minimum claim threshold → claim still opens (minimum overlay) but
    // the button shows disabled coloring per design.
    const belowMinimum =
        !!eligible &&
        eligible.tokenAmount > 0 &&
        eligible.tokenAmount < (eligible.minimumClaimThreshold ?? 0)

    return (
        <section className={styles.root} aria-label={t('rewards') || 'Rewards'}>
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
                            <p className={styles.label}>{t('claimable') || 'Claimable'}</p>
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
                                        {t('claim') || 'Claim'}
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
                            <p className={styles.label}>{t('pending') || 'Pending'}</p>
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
                                        onClick={() => navigate('/history')}
                                        aria-label={t('viewRewards') || 'View rewards'}
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
                    onClick={() => navigate('/faq')}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className={`${styles.skeleton} ${styles.skeletonHelperBar}`} aria-hidden="true" />
                    ) : (
                        t('needHelp') || 'Need Help?'
                    )}
                </button>
                <button
                    type="button"
                    className={`${styles.helperBtn} ${isLoading ? styles.helperBtnLoading : ''}`}
                    onClick={() => window.open(supportUrl, '_blank', 'noopener,noreferrer')}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className={`${styles.skeleton} ${styles.skeletonHelperBar}`} aria-hidden="true" />
                    ) : (
                        t('missingReward') || 'Missing a Reward?'
                    )}
                </button>
            </div>
        </section>
    )
}

export default Rewards
