import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon/Icon'
import message from '../../../utils/message'
import {
    formatSignedAmount,
    MobileClaimModalState,
    shortenWalletAddress,
} from '../../utils/claimFlow'
import { DEV_MODE } from '../../../config'
import styles from './styles.module.css'

interface Props {
    state: MobileClaimModalState | null
    tokenSymbol: string
    tokenAmountDisplay: string
    tokenAmount: number
    minimumClaimThreshold: number
    walletAddress: string | null
    /** Wallet display name from the backend token (verify response). */
    walletName?: string
    /** Wallet emoji asset URL from the backend token (verify response). */
    walletEmoji?: string
    explorerLink: string | null
    onClose: () => void
    onConfirm: () => void
    onTryAgain: () => void
    /** DEV ONLY: jump to a modal state without a real claim. */
    onDevSetState?: (state: MobileClaimModalState) => void
}

const MobileClaimModal = ({
    state,
    tokenSymbol,
    tokenAmountDisplay,
    tokenAmount,
    minimumClaimThreshold,
    walletAddress,
    walletName,
    walletEmoji,
    explorerLink,
    onClose,
    onConfirm,
    onTryAgain,
    onDevSetState,
}: Props) => {
    const { t } = useTranslation()
    const open = !!state
    // Fall back to the default emoji icon if the provided emoji URL fails to load.
    const [emojiFailed, setEmojiFailed] = useState(false)

    useEffect(() => {
        if (!open) return
        const { documentElement: html, body } = document
        const prevHtml = html.style.overflow
        const prevBody = body.style.overflow
        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'
        message({ action: 'POPUP_OPENED', overlayBgColor: 'rgba(15, 15, 26, 0.75)' })

        return () => {
            html.style.overflow = prevHtml
            body.style.overflow = prevBody
            message({ action: 'POPUP_CLOSED' })
        }
    }, [open])

    if (!open) return null

    const signedAmount = formatSignedAmount(tokenAmountDisplay, tokenAmount)
    const shortAddress = shortenWalletAddress(walletAddress)

    // DEV ONLY: fallback so "Show in explorer" renders when jumping states without a real claim.
    const resolvedExplorerLink =
        explorerLink || (DEV_MODE ? 'https://solscan.io/' : null)

    const title =
        state === 'confirm'
            ? t('claimRewardsTitle') || 'Claim Rewards'
            : state === 'minimum'
                ? t('minimumClaimTitle') || 'Minimum Claim'
                : state === 'success'
                    ? t('rewardClaimedHeader') || 'Reward claimed'
                    : state === 'failure'
                        ? t('claimRewardsTitle') || 'Claim Rewards'
                        : state === 'processing'
                            ? t('claimingHeader') || 'Claiming'
                            : ''

    return createPortal(
        <div
            className={styles.backdrop}
            onClick={onClose}
        >
            <section
                className={styles.panel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-claim-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                    {(state === 'confirm' || state === 'minimum' || state === 'success' || state === 'failure' || state === 'processing') && (
                        <header className={styles.header}>
                            <span className={styles.headerSpacer} aria-hidden="true" />
                            <h2 id="mobile-claim-modal-title" className={styles.headerTitle}>
                                {title}
                            </h2>
                            {state === 'minimum' ? (
                                <button
                                    type="button"
                                    className={styles.headerClose}
                                    aria-label={t('close') || 'Close'}
                                    onClick={onClose}
                                >
                                    <Icon name="x-mark.svg" alt="" />
                                </button>
                            ) : (
                                <span className={styles.headerSpacer} aria-hidden="true" />
                            )}
                        </header>
                    )}

                    {state === 'confirm' && (
                        <>
                            <div className={styles.body}>
                                <p className={styles.intro}>
                                    {t('claimIntro') || 'This page ask you to claim rewards into your account. This transaction will impact your balance.'}
                                </p>

                                <div className={styles.rowPrimary}>
                                    <span className={styles.rowLeft}>
                                        <span className={styles.coinIcon}>
                                            <Icon name="solana.svg" alt="" />
                                        </span>
                                        <span className={styles.rowLabel}>{tokenSymbol || 'Token'}</span>
                                    </span>
                                    <span className={styles.rowRight}>
                                        <span className={styles.amountPositive}>
                                            {signedAmount}
                                        </span>
                                        <span className={styles.badge}>{tokenSymbol}</span>
                                    </span>
                                </div>

                                <div className={styles.rowSecondary}>
                                    <span className={styles.rowLeft}>
                                        <span className={styles.walletEmoji} aria-hidden="true">
                                            {walletEmoji && !emojiFailed ? (
                                                <img src={walletEmoji} alt="" onError={() => setEmojiFailed(true)} />
                                            ) : (
                                                <Icon name="smiling-face-3-hearts.svg" alt="" />
                                            )}
                                        </span>
                                        <span className={styles.rowLabel}>{walletName || t('claimWalletName') || 'WalletName'}</span>
                                    </span>
                                    <span className={styles.valueMuted}>{shortAddress}</span>
                                </div>

                                <div className={styles.rowSecondary}>
                                    <span className={styles.rowLabel}>{t('networkFee') || 'Network fee'}</span>
                                    <span className={styles.valueMuted}>{t('networkFeeWaived') || 'Waived'}</span>
                                </div>

                                <div className={styles.rowSecondary}>
                                    <span className={styles.rowLabel}>{t('minimalAmountClaim') || 'Minimal amount claim'}</span>
                                    <span className={styles.valueMuted}>{`${minimumClaimThreshold} ${tokenSymbol}`.trim()}</span>
                                </div>
                            </div>

                            <footer className={styles.footerTwoButtons}>
                                <button type="button" className={styles.btnSecondary} onClick={onClose}>
                                    {t('close') || 'Close'}
                                </button>
                                <button type="button" className={styles.btnPrimary} onClick={onConfirm}>
                                    {t('confirm') || 'Confirm'}
                                </button>
                            </footer>

                            {DEV_MODE && onDevSetState && (
                                <div className={styles.devButtons}>
                                    <button type="button" onClick={() => onDevSetState('processing')}>
                                        DEV: Processing
                                    </button>
                                    <button type="button" onClick={() => onDevSetState('success')}>
                                        DEV: Success
                                    </button>
                                    <button type="button" onClick={() => onDevSetState('failure')}>
                                        DEV: Fail
                                    </button>
                                    <button type="button" onClick={() => onDevSetState('minimum')}>
                                        DEV: Minimum
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {state === 'minimum' && (
                        <>
                            <div className={styles.minimumBody}>
                                <div className={styles.minimumText}>
                                    <h3 className={styles.minimumTitle}>
                                        {t('minimumOnWayTitle') || 'Your cashback is on the way.'}
                                    </h3>
                                    <p className={styles.minimumPara}>
                                        {t('minimumOnWayMsg1') || 'Every purchase you make through Nightly earns you real crypto cashback.'}
                                    </p>
                                    <p className={styles.minimumPara}>
                                        {t('minimumOnWayMsg2') || `Once your earnings cross ${minimumClaimThreshold} ${tokenSymbol}, you'll be able to send them straight to your wallet, fast, on-chain, and yours to keep.`}
                                    </p>
                                    <p className={styles.minimumHint}>
                                        {t('minimumKeepShopping') || 'Keep shopping. Your rewards are stacking up.'}
                                    </p>
                                </div>
                            </div>
                            <footer className={styles.footerOneButton}>
                                <button type="button" className={styles.btnSecondaryWide} onClick={onClose}>
                                    {t('close') || 'Close'}
                                </button>
                            </footer>
                        </>
                    )}

                    {state === 'processing' && (
                        <div className={styles.failureBody}>
                            <div className={styles.failureIconWrap}>
                                <span className={styles.spinnerCircle}>
                                    <span className={styles.spinner} aria-hidden="true" />
                                </span>
                            </div>
                            <div className={styles.failureText}>
                                <h3 className={styles.failureTitle}>{t('claiming') || 'Claiming...'}</h3>
                                <p className={styles.failureMsg}>
                                    {t('claimProcessingMsg') || 'Your reward will be ready soon.'}
                                    <br />
                                    {t('claimProcessingMsg2') || 'Please wait...'}
                                </p>
                                {resolvedExplorerLink ? (
                                    <a
                                        href={resolvedExplorerLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.successExplorer}
                                    >
                                        {t('showInExplorer') || 'Show in explorer'} <Icon name="open-website.svg" alt="" />
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    )}

                    {state === 'success' && (
                        <>
                            <div className={styles.successBody}>
                                <div className={styles.successDesign}>
                                    <span className={styles.successGlow} aria-hidden="true">
                                        <Icon name="success-glow.svg" alt="" />
                                    </span>
                                    <span className={`${styles.successStar} ${styles.successStar1}`} aria-hidden="true">
                                        <Icon name="star-9454.svg" alt="" />
                                    </span>
                                    <span className={`${styles.successStar} ${styles.successStar2}`} aria-hidden="true">
                                        <Icon name="star-9458.svg" alt="" />
                                    </span>
                                    <span className={`${styles.successStar} ${styles.successStar3}`} aria-hidden="true">
                                        <Icon name="star-9459.svg" alt="" />
                                    </span>
                                    <span className={`${styles.successStar} ${styles.successStar4}`} aria-hidden="true">
                                        <Icon name="star-9460.svg" alt="" />
                                    </span>
                                    <span className={`${styles.successStar} ${styles.successStar5}`} aria-hidden="true">
                                        <Icon name="star-9461.svg" alt="" />
                                    </span>
                                    <span className={`${styles.successStar} ${styles.successStar6}`} aria-hidden="true">
                                        <Icon name="star-9462.svg" alt="" />
                                    </span>
                                    <h3 className={styles.successAmount}>
                                        {tokenAmountDisplay} {tokenSymbol}
                                    </h3>
                                </div>
                                <span className={styles.successGlowLine} aria-hidden="true">
                                    <Icon name="success-glow-line.svg" alt="" />
                                </span>
                                <div className={styles.successText}>
                                    <h4 className={styles.successTitle}>{t('rewardClaimedTitle') || 'Reward claimed!'}</h4>
                                    <p className={styles.successMsg}>
                                        {t('rewardClaimedMsg', { address: shortAddress || walletName || 'Address' })}
                                    </p>
                                    {resolvedExplorerLink ? (
                                        <a
                                            href={resolvedExplorerLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={styles.successExplorer}
                                        >
                                            {t('showInExplorer') || 'Show in explorer'} <Icon name="open-website.svg" alt="" />
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                            <footer className={styles.footerOneButton}>
                                <button type="button" className={styles.btnSecondaryWide} onClick={onClose}>
                                    {t('close') || 'Close'}
                                </button>
                            </footer>
                        </>
                    )}

                    {state === 'failure' && (
                        <>
                            <div className={styles.failureBody}>
                                <div className={styles.failureIconWrap}>
                                    <span className={styles.failureCircle}>
                                        <Icon name="x-circle-red.svg" alt="" />
                                    </span>
                                </div>
                                <div className={styles.failureText}>
                                    <h3 className={styles.failureTitle}>{t('claimFailedTitle') || 'Failed...'}</h3>
                                    <p className={styles.failureMsg}>
                                        {t('claimFailedMsg') || 'Something went wrong while claiming your reward. Make sure you have stable internet connection and try again.'}
                                    </p>
                                    {resolvedExplorerLink ? (
                                        <a
                                            href={resolvedExplorerLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={styles.successExplorer}
                                        >
                                            {t('showInExplorer') || 'Show in explorer'} <Icon name="open-website.svg" alt="" />
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                            <footer className={styles.footerTwoButtonsStatus}>
                                <button type="button" className={styles.btnSecondary} onClick={onClose}>
                                    {t('close') || 'Close'}
                                </button>
                                <button type="button" className={styles.btnPrimary} onClick={onTryAgain}>
                                    {t('tryAgain') || 'Try again'}
                                </button>
                            </footer>
                        </>
                    )}
            </section>
        </div>,
        document.body,
    )
}

export default MobileClaimModal
