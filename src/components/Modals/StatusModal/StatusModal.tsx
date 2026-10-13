/**
 * Claim and pairing outcomes: processing, success, failure, paired, pair
 * failed, and the guide to installing a wallet.
 * Pure UI — logic in useStatusModal.
 */
import styles from './styles.module.css'
import { ComponentProps } from 'react'
import Modal from '../../Modal/Modal'
import Icon from '../../Icon/Icon'
import { useStatusModal, type StatusLabels } from './useStatusModal'

export type StatusModalState = 'success' | 'failure' | 'loading' | 'paired' | 'pairFailed' | 'claim'

interface ClaimInfo {
    amount?: string
    address?: string | null
    /** Shown under the balance on the claim guide, already formatted. */
    usdValue?: string | number
    /** Store listing the guide's CTA opens. Without it the CTA only closes. */
    claimUrl?: string
}

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'>, ClaimInfo {
    status: StatusModalState
    /** `pairFailed` only: i18n key for the reason the attempt failed. Defaults
     *  to `pairFailedMsg`, which reads as the email-not-found case. */
    messageKey?: string
    /** `pairFailed` only: makes "Try Again" restart the flow rather than close. */
    onRetry?: () => void
}

interface StatusProps { closeFn: () => void, labels: StatusLabels }

const Loading = ({ closeFn, labels }: StatusProps) => (
    <div className={styles.card}>
        <span className={styles.loader} role="status" aria-label={labels.processingTitle} />
        <div className={`${styles.title} ${styles.title_loading}`}>
            {labels.processingTitle}
        </div>
        <div className={`${styles.msg} ${styles.msg_wide}`}>
            <div>{labels.processingMsg}</div>
            <div>{labels.processingMsg2}</div>
        </div>
        <button
            id="status-modal-loading-btn"
            onClick={() => closeFn()}
            className={styles.btn}
        >{labels.close}</button>
    </div>
)

const STARS = ['a', 'b', 'c', 'd', 'e', 'f']

const Success = ({ closeFn, labels, amount }: StatusProps & ClaimInfo) => (
    <div className={styles.success_card}>
        <div className={styles.art}>
            <Icon className={styles.glow} name="success-glow.svg" alt="" />
            {amount ? <div className={styles.amount}>{amount}</div> : null}
            <div className={styles.stars}>
                {STARS.map(s => (
                    <Icon key={s} className={styles[`star_${s}`]} name={`star-${s}.svg`} alt="" />
                ))}
            </div>
        </div>
        <div className={styles.success_title}>
            {labels.successTitle}
        </div>
        <div className={styles.success_msg}>
            {labels.successMsg}
        </div>
        <button
            id="status-modal-success-btn"
            onClick={() => closeFn()}
            className={`${styles.btn} ${styles.success_btn}`}
        >{labels.close}</button>
    </div>
)

const Failure = ({ closeFn, labels }: StatusProps) => (
    <div className={styles.card}>
        <Icon className={styles.icon} name="error.svg" alt="" />
        <div className={`${styles.title} ${styles.title_error}`}>
            {labels.errorTitle}
        </div>
        <div className={styles.msg}>
            {labels.errorMsg}
        </div>
        <button
            id="status-modal-failure-btn"
            onClick={() => closeFn()}
            className={styles.btn}
        >{labels.close}</button>
    </div>
)

/* Pairing outcomes. Same card as the claim states - icon, one line of text,
   then the button - so only the glyph and the copy differ. */
const Paired = ({ closeFn, labels }: StatusProps) => (
    <div className={styles.card}>
        <Icon className={styles.icon_paired} name="tick-circle.svg" alt="" />
        <div className={`${styles.title} ${styles.pair_title}`}>
            {labels.pairSuccessTitle}
        </div>
        <button
            id="status-modal-paired-btn"
            onClick={() => closeFn()}
            className={styles.btn}
        >{labels.close}</button>
    </div>
)

const PairFailed = ({ closeFn, labels, onRetry }: StatusProps & Pick<Props, 'onRetry'>) => (
    <div className={styles.card}>
        <Icon className={styles.icon_pair_failed} name="error-triangle.svg" alt="" />
        {/* No title above it, so the message sits at the icon's own gap. */}
        <div className={`${styles.msg} ${styles.msg_pair}`}>
            {labels.pairFailedMsg}
        </div>
        {/* Retrying is not a close: it stays in the modal and goes back to
            the email screen, so it must not emit POPUP_CLOSED. */}
        <button
            id="status-modal-pair-failed-btn"
            onClick={onRetry ?? closeFn}
            className={`${styles.btn} ${styles.btn_strong}`}
        >{labels.pairFailedBtn}</button>
    </div>
)

interface ClaimProps extends StatusProps, ClaimInfo {
    steps: { n: number, text: string }[]
}

/* Claim guide: balance on top, then how to get the wallet that receives it.
   The steps read down each column, so the grid fills column-first. */
const Claim = ({ closeFn, labels, steps, amount, claimUrl }: ClaimProps) => (
    <div className={styles.claim_card}>
        <div className={styles.claim_badge}>
            <Icon className={styles.claim_badge_icon} name="wallet-badge.svg" fallbackName="wallet.svg" alt="" />
        </div>
        <div className={styles.claim_body}>
            <div className={styles.balance_card}>
                <div className={styles.balance_header}>
                    <div className={styles.balance_label}>{labels.claimBalance}</div>
                    <div className={styles.balance_badge}>{labels.claimBadge}</div>
                </div>
                <div className={styles.balance_row}>
                    <div className={styles.balance_amounts}>
                        <div className={styles.balance_amount}>{amount}</div>
                        {labels.claimCurrentValue ? (
                            <div className={styles.balance_usd}>
                                {labels.claimCurrentValue}
                            </div>
                        ) : null}
                    </div>
                    <Icon className={styles.balance_sparkle} name="sparkle.svg" alt="" />
                </div>
            </div>
            <div className={styles.guide}>
                <div className={styles.guide_title}>{labels.claimTitle}</div>
                <div className={styles.steps}>
                    {steps.map(step => (
                        <div key={step.n} className={styles.step}>
                            <div className={styles.step_number}>{step.n}</div>
                            <div className={styles.step_text}>{step.text}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        {/* A top-level tab: the portal runs in the partner's iframe, so a
            same-tab navigation would replace the portal, not the page. */}
        {claimUrl ? (
            <a
                id="status-modal-claim-btn"
                className={styles.claim_btn}
                href={claimUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => closeFn()}
            >{labels.claimCta}</a>
        ) : (
            <button
                id="status-modal-claim-btn"
                onClick={() => closeFn()}
                className={styles.claim_btn}
            >{labels.claimCta}</button>
        )}
    </div>
)

const shellOverrides = {
    '--custom-modal-bg': 'var(--modal-status-bg, var(--modal-bg))',
    '--custom-modal-radius': 'var(--modal-status-radius, var(--modal-radius))',
}

const StatusModal = ({ open, closeFn, status, amount, address, usdValue, claimUrl, messageKey, onRetry }: Props) => {
    const { close, claimSteps, labels } = useStatusModal({ closeFn, address, usdValue, messageKey })

    return (
        <Modal
            open={open}
            closeFn={closeFn}
            className={styles.overlay}
            contentClassName={styles.shell}
            closeBtnClassName={styles.close}
            style={shellOverrides}
        >
            {status === 'loading' ?
                <Loading closeFn={close} labels={labels} />
                : status === 'failure' ?
                    <Failure closeFn={close} labels={labels} />
                    : status === 'success' ?
                        <Success amount={amount} closeFn={close} labels={labels} />
                        : status === 'paired' ?
                            <Paired closeFn={close} labels={labels} />
                            : status === 'pairFailed' ?
                                <PairFailed closeFn={close} labels={labels} onRetry={onRetry} />
                                : status === 'claim' ?
                                    <Claim amount={amount} claimUrl={claimUrl} steps={claimSteps} closeFn={close} labels={labels} />
                                    : null
            }
        </Modal>
    )
}

export default StatusModal
