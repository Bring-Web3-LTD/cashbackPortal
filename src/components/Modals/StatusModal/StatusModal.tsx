import styles from './styles.module.css'
import { ComponentProps } from 'react'
import Modal from '../../Modal/Modal'
import message from '../../../utils/message'
import { useTranslation } from 'react-i18next'
import Icon from '../../Icon/Icon'
import { shortenWalletAddress } from '../../../utils/claimFlow'

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

interface StatusProps { closeFn: () => void }

const Loading = ({ closeFn }: StatusProps) => {
    const { t } = useTranslation()

    return (
        <div className={styles.card}>
            <span className={styles.loader} role="status" aria-label={t('statusProcessingTitle')} />
            <div className={`${styles.title} ${styles.title_loading}`}>
                {t('statusProcessingTitle')}
            </div>
            <div className={`${styles.msg} ${styles.msg_wide}`}>
                <div>{t('statusProcessingMsg')}</div>
                <div>{t('statusProcessingMsg2')}</div>
            </div>
            <button
                id="status-modal-loading-btn"
                onClick={() => closeFn()}
                className={styles.btn}
            >{t('statusCloseBtn')}</button>
        </div>
    )
}

const STARS = ['a', 'b', 'c', 'd', 'e', 'f']

const Success = ({ closeFn, amount, address }: StatusProps & ClaimInfo) => {
    const { t } = useTranslation()
    return (
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
                {t('statusSuccessTitle')}
            </div>
            <div className={styles.success_msg}>
                {t('statusSuccessMsg', { address: shortenWalletAddress(address) })}
            </div>
            <button
                id="status-modal-success-btn"
                onClick={() => closeFn()}
                className={`${styles.btn} ${styles.success_btn}`}
            >{t('statusCloseBtn')}</button>
        </div>
    )
}


const Failure = ({ closeFn }: StatusProps) => {
    const { t } = useTranslation()

    return (
        <div className={styles.card}>
            <Icon className={styles.icon} name="error.svg" alt="" />
            <div className={`${styles.title} ${styles.title_error}`}>
                {t('statusErrorTitle')}
            </div>
            <div className={styles.msg}>
                {t('statusErrorMsg')}
            </div>
            <button
                id="status-modal-failure-btn"
                onClick={() => closeFn()}
                className={styles.btn}
            >{t('statusCloseBtn')}</button>
        </div>
    )
}

/* Pairing outcomes. Same card as the claim states - icon, one line of text,
   then the button - so only the glyph and the copy differ. */
const Paired = ({ closeFn }: StatusProps) => {
    const { t } = useTranslation()

    return (
        <div className={styles.card}>
            <Icon className={styles.icon_paired} name="tick-circle.svg" alt="" />
            <div className={`${styles.title} ${styles.pair_title}`}>
                {t('pairSuccessTitle')}
            </div>
            <button
                id="status-modal-paired-btn"
                onClick={() => closeFn()}
                className={styles.btn}
            >{t('statusCloseBtn')}</button>
        </div>
    )
}

const PairFailed = ({ closeFn, messageKey, onRetry }: StatusProps & Pick<Props, 'messageKey' | 'onRetry'>) => {
    const { t } = useTranslation()

    return (
        <div className={styles.card}>
            <Icon className={styles.icon_pair_failed} name="error-triangle.svg" alt="" />
            {/* No title above it, so the message sits at the icon's own gap. */}
            <div className={`${styles.msg} ${styles.msg_pair}`}>
                {t(messageKey ?? 'pairFailedMsg')}
            </div>
            {/* Retrying is not a close: it stays in the modal and goes back to
                the email screen, so it must not emit POPUP_CLOSED. */}
            <button
                id="status-modal-pair-failed-btn"
                onClick={onRetry ?? closeFn}
                className={`${styles.btn} ${styles.btn_strong}`}
            >{t('pairFailedBtn')}</button>
        </div>
    )
}

const CLAIM_STEPS = [1, 2, 3, 4] as const

/* Claim guide: balance on top, then how to get the wallet that receives it.
   The steps read down each column, so the grid fills column-first. */
const Claim = ({ closeFn, amount, usdValue, claimUrl }: StatusProps & ClaimInfo) => {
    const { t } = useTranslation()
    const cta = t('claimGuideCta')

    return (
        <div className={styles.claim_card}>
            <div className={styles.claim_badge}>
                <Icon className={styles.claim_badge_icon} name="wallet-badge.svg" fallbackName="wallet.svg" alt="" />
            </div>
            <div className={styles.claim_body}>
                <div className={styles.balance_card}>
                    <div className={styles.balance_header}>
                        <div className={styles.balance_label}>{t('claimGuideBalance')}</div>
                        <div className={styles.balance_badge}>{t('claimGuideBadge')}</div>
                    </div>
                    <div className={styles.balance_row}>
                        <div className={styles.balance_amounts}>
                            <div className={styles.balance_amount}>{amount}</div>
                            {usdValue ? (
                                <div className={styles.balance_usd}>
                                    {t('claimGuideCurrentValue', { value: usdValue })}
                                </div>
                            ) : null}
                        </div>
                        <Icon className={styles.balance_sparkle} name="sparkle.svg" alt="" />
                    </div>
                </div>
                <div className={styles.guide}>
                    <div className={styles.guide_title}>{t('claimGuideTitle')}</div>
                    <div className={styles.steps}>
                        {CLAIM_STEPS.map(n => (
                            <div key={n} className={styles.step}>
                                <div className={styles.step_number}>{n}</div>
                                <div className={styles.step_text}>{t(`claimGuideStep${n}`)}</div>
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
                >{cta}</a>
            ) : (
                <button
                    id="status-modal-claim-btn"
                    onClick={() => closeFn()}
                    className={styles.claim_btn}
                >{cta}</button>
            )}
        </div>
    )
}

const shellOverrides = {
    '--custom-modal-bg': 'var(--modal-status-bg, var(--modal-bg))',
    '--custom-modal-radius': 'var(--modal-status-radius, var(--modal-radius))',
}

const StatusModal = ({ open, closeFn, status, amount, address, usdValue, claimUrl, messageKey, onRetry }: Props) => {
    const close = () => {
        message({ action: 'POPUP_CLOSED' })
        closeFn()
    }

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
                <Loading closeFn={close} />
                : status === 'failure' ?
                    <Failure closeFn={close} />
                    : status === 'success' ?
                        <Success amount={amount} address={address} closeFn={close} />
                        : status === 'paired' ?
                            <Paired closeFn={close} />
                            : status === 'pairFailed' ?
                                <PairFailed closeFn={close} messageKey={messageKey} onRetry={onRetry} />
                                : status === 'claim' ?
                                    <Claim amount={amount} usdValue={usdValue} claimUrl={claimUrl} closeFn={close} />
                                    : null
            }
        </Modal>
    )
}

export default StatusModal