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
import Icon from '../../../components/Icon/Icon'
import TokenAmount from '../../../components/TokenAmount/TokenAmount'
import { useBalance, selectEligible, selectPending } from '../../hooks/useBalance'
import styles from './styles.module.css'

interface Props {
    /** Override the Claimable card's "Claim" click handler. */
    onClaim?: () => void
}

const MobileRewards = ({ onClaim }: Props) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const { data, isLoading } = useBalance()

    const eligible = selectEligible(data)
    const pending = selectPending(data)

    // Token amounts are rendered from the backend-formatted `display` string
    // (4 significant digits, Unicode subscripts) via <TokenAmount />. When
    // there's no balance row yet (e.g. no wallet connected) the backend sends
    // nothing, so we fall back to a plain "0.00" on the client.
    const fallbackSymbol = cryptoSymbols?.[0] ?? ''
    const claimableDisplay = eligible?.tokenAmountDisplay ?? '0.00'
    const claimableSymbol = eligible?.tokenSymbol ?? fallbackSymbol
    const pendingDisplay = pending?.tokenAmountDisplay ?? '0.00'
    const pendingSymbol = pending?.tokenSymbol ?? fallbackSymbol

    const canClaim =
        !!eligible &&
        eligible.tokenAmount > 0 &&
        eligible.tokenAmount >= (eligible.minimumClaimThreshold ?? 0)

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
                                    <span className={styles.amount}>
                                        <TokenAmount value={claimableDisplay} />
                                        {claimableSymbol ? ` ${claimableSymbol}` : null}
                                    </span>
                                    <button
                                        type="button"
                                        className={styles.claimBtn}
                                        onClick={onClaim}
                                        disabled={!canClaim}
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
                                        <TokenAmount value={pendingDisplay} />
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
                    onClick={() => navigate('/faq')}
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

export default MobileRewards
