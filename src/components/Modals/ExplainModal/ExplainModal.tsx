/**
 * What's This: three cards explaining the portal, then the claim CTA.
 * Pure UI — logic in useExplainModal.
 */
import styles from './styles.module.css'
import Modal from '../../Modal/Modal'
import { ComponentProps } from 'react'
import Icon from '../../Icon/Icon'
import { useExplainModal } from './useExplainModal'

const shellOverrides = {
    '--custom-modal-bg': 'var(--modal-explain-bg, var(--modal-bg))',
    '--custom-modal-radius': 'var(--modal-explain-radius, var(--modal-radius))',
}

type Props = Omit<ComponentProps<typeof Modal>, 'children'>

const ExplainModal = ({ open, closeFn }: Props) => {
    const { cards, claimDisabled, claimAndClose, labels } = useExplainModal(closeFn)

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
                        <div className={styles.title}>{labels.title}</div>
                    </div>
                    <div className={styles.subtitle_row}>
                        <p className={styles.subtitle}>{labels.subtitle}</p>
                    </div>
                </div>
                {/* The cards and the CTA sit closer to each other than to the
                    intro above them, so they share a block of their own. */}
                <div className={styles.body}>
                <div className={styles.grid}>
                    {cards.map(card => (
                        <div key={card.key} className={styles.card}>
                            <div className={styles.icon_container}>
                                <Icon className={styles.icon} name={card.icon} alt="" />
                            </div>
                            <div className={styles.card_content}>
                                <div className={styles.card_title}>{card.title}</div>
                                <div className={styles.card_text}>{card.text}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={styles.action_area}>
                    <button
                        id="explain-modal-btn"
                        className={styles.btn}
                        disabled={claimDisabled}
                        onClick={claimAndClose}
                    >
                        {labels.claimCashback}
                    </button>
                </div>
                </div>
            </div>
        </Modal>
    )
}

export default ExplainModal
