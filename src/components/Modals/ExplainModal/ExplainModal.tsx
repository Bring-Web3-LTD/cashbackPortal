import styles from './styles.module.css'
import Modal from '../../Modal/Modal'
import { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../Icon/Icon'
import { useBalance, selectEligible } from '../../../hooks/useBalance'

const shellOverrides = {
    '--custom-modal-bg': 'var(--modal-explain-bg, var(--modal-bg))',
    '--custom-modal-radius': 'var(--modal-explain-radius, var(--modal-radius))',
}

const CARDS = ['coupons', 'cashback', 'claim'] as const

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    /** Fired when the CTA is pressed. The modal closes either way. */
    onClaim?: () => void
}

const ExplainModal = ({ open, closeFn, onClaim }: Props) => {
    const { t } = useTranslation()
    // Shares the Rewards balance query (same key), so this costs no extra fetch.
    const { data, isLoading } = useBalance()
    const eligible = selectEligible(data)

    // Mirrors the Rewards claim button: no balance row, no threshold, or a
    // balance under the threshold all disable the claim.
    const claimDisabled =
        isLoading ||
        !eligible ||
        typeof eligible.minimumClaimThreshold !== 'number' ||
        eligible.tokenAmount < eligible.minimumClaimThreshold

    return (
        <Modal
            open={open}
            closeFn={closeFn}
            className={styles.overlay}
            contentClassName={styles.shell}
            closeBtnClassName={styles.close}
            style={shellOverrides}
        >
            <div className={styles.content}>
                <div className={styles.intro}>
                    <div className={styles.header_area}>
                        <div className={styles.title}>{t('explainTitle')}</div>
                    </div>
                    <div className={styles.subtitle_row}>
                        <p className={styles.subtitle}>{t('explainSubtitle')}</p>
                    </div>
                </div>
                <div className={styles.grid}>
                    {CARDS.map(card => (
                        <div key={card} className={styles.card}>
                            <div className={styles.icon_container}>
                                <Icon className={styles.icon} name={`explain-${card}.svg`} alt="" />
                            </div>
                            <div className={styles.card_content}>
                                <div className={styles.card_title}>{t(`explain_${card}_title`)}</div>
                                <div className={styles.card_text}>{t(`explain_${card}_text`)}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={styles.action_area}>
                    <button
                        id="explain-modal-btn"
                        className={styles.btn}
                        disabled={claimDisabled}
                        onClick={() => { onClaim?.(); closeFn() }}
                    >
                        {t('claimCashback')}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default ExplainModal
