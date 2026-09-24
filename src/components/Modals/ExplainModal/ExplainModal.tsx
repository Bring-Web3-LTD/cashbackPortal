import styles from './styles.module.css'
import Modal from '../../Modal/Modal'
import { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../Icon/Icon'
import { useClaim } from '../../../hooks/useClaim'

const shellOverrides = {
    '--custom-modal-bg': 'var(--modal-explain-bg, var(--modal-bg))',
    '--custom-modal-radius': 'var(--modal-explain-radius, var(--modal-radius))',
}

const CARDS = ['coupons', 'cashback', 'claim'] as const

type Props = Omit<ComponentProps<typeof Modal>, 'children'>

const ExplainModal = ({ open, closeFn }: Props) => {
    const { t } = useTranslation()
    // The same action the claimable card's button runs, off the same rule for
    // when it is available - so the two cannot disagree.
    const { claim, claimDisabled } = useClaim()

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
                {/* The cards and the CTA sit closer to each other than to the
                    intro above them, so they share a block of their own. */}
                <div className={styles.body}>
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
                        onClick={() => { claim(); closeFn() }}
                    >
                        {t('claimCashback')}
                    </button>
                </div>
                </div>
            </div>
        </Modal>
    )
}

export default ExplainModal
