/** Mobile claim flow modal (confirm / minimum / processing / success /
 * failure). Pure UI — logic in useClaimModal. */
import { createPortal } from 'react-dom'
import Icon from '../Icon/Icon'
import { useClaimModal, ClaimModalProps } from './useClaimModal'
import styles from './styles.mobile.module.css'

const ClaimModal = (props: ClaimModalProps) => {
    const {
        state,
        tokenSymbol,
        tokenAmountDisplay,
        minimumClaimThreshold,
        walletEmoji,
        explorerLink,
        onClose,
        onConfirm,
        onTryAgain,
    } = props
    const {
        labels,
        open,
        cryptoToken,
        emojiFailed,
        onEmojiError,
        signedAmount,
        shortAddress,
        title,
    } = useClaimModal(props)

    if (!open) return null

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
                                    aria-label={labels.close}
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
                                    {labels.claimIntro}
                                </p>

                                <div className={styles.rowPrimary}>
                                    <span className={styles.rowLeft}>
                                        {cryptoToken && (
                                            <span className={styles.coinIcon}>
                                                <img src={cryptoToken.icon} alt={cryptoToken.name} />
                                            </span>
                                        )}
                                        <span className={styles.rowLabel}>{cryptoToken?.name || tokenSymbol}</span>
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
                                        {(walletEmoji && !emojiFailed) && (
                                            <span className={styles.walletEmoji} aria-hidden="true">
                                                <img src={walletEmoji} alt="" onError={onEmojiError} />
                                            </span>
                                        )}
                                        <span className={styles.rowLabel}>
                                            {labels.walletDisplay}
                                        </span>
                                    </span>
                                    <span className={styles.valueMuted}>{shortAddress}</span>
                                </div>

                                <div className={styles.rowSecondary}>
                                    <span className={styles.rowLabel}>{labels.networkFee}</span>
                                    <span className={styles.valueMuted}>{labels.networkFeeWaived}</span>
                                </div>

                                <div className={styles.rowSecondary}>
                                    <span className={styles.rowLabel}>{labels.minimalAmountClaim}</span>
                                    <span className={styles.valueMuted}>{`${minimumClaimThreshold} ${tokenSymbol}`.trim()}</span>
                                </div>
                            </div>

                            <footer className={styles.footerTwoButtons}>
                                <button type="button" className={styles.btnSecondary} onClick={onClose}>
                                    {labels.close}
                                </button>
                                <button type="button" className={styles.btnPrimary} onClick={onConfirm}>
                                    {labels.confirm}
                                </button>
                            </footer>

                        </>
                    )}

                    {state === 'minimum' && (
                        <>
                            <div className={styles.minimumBody}>
                                <div className={styles.minimumText}>
                                    <h3 className={styles.minimumTitle}>
                                        {labels.minimumOnWayTitle}
                                    </h3>
                                    <p className={styles.minimumPara}>
                                        {labels.minimumOnWayMsg1}
                                    </p>
                                    <p className={styles.minimumPara}>
                                        {labels.minimumOnWayMsg2}
                                    </p>
                                    <p className={styles.minimumHint}>
                                        {labels.minimumKeepShopping}
                                    </p>
                                </div>
                            </div>
                            <footer className={styles.footerOneButton}>
                                <button type="button" className={styles.btnSecondaryWide} onClick={onClose}>
                                    {labels.close}
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
                                <h3 className={styles.failureTitle}>{labels.claiming}</h3>
                                <p className={styles.failureMsg}>
                                    {labels.claimProcessingMsg}
                                    <br />
                                    {labels.claimProcessingMsg2}
                                </p>
                                {explorerLink ? (
                                    <a
                                        href={explorerLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.successExplorer}
                                    >
                                        {labels.showInExplorer} <Icon name="open-website.svg" alt="" />
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
                                    <h4 className={styles.successTitle}>{labels.rewardClaimedTitle}</h4>
                                    <p className={styles.successMsg}>
                                        {labels.rewardClaimedMsg}
                                    </p>
                                    {explorerLink ? (
                                        <a
                                            href={explorerLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={styles.successExplorer}
                                        >
                                            {labels.showInExplorer} <Icon name="open-website.svg" alt="" />
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                            <footer className={styles.footerOneButton}>
                                <button type="button" className={styles.btnSecondaryWide} onClick={onClose}>
                                    {labels.close}
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
                                    <h3 className={styles.failureTitle}>{labels.claimFailedTitle}</h3>
                                    <p className={styles.failureMsg}>
                                        {labels.claimFailedMsg}
                                    </p>
                                    {explorerLink ? (
                                        <a
                                            href={explorerLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={styles.successExplorer}
                                        >
                                            {labels.showInExplorer} <Icon name="open-website.svg" alt="" />
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                            <footer className={styles.footerTwoButtonsStatus}>
                                <button type="button" className={styles.btnSecondary} onClick={onClose}>
                                    {labels.close}
                                </button>
                                <button type="button" className={styles.btnPrimary} onClick={onTryAgain}>
                                    {labels.tryAgain}
                                </button>
                            </footer>
                        </>
                    )}
            </section>
        </div>,
        document.body,
    )
}

export default ClaimModal
