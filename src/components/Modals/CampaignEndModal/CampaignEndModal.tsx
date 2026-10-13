/**
 * Shown when the campaign behind the URL's id has already sold out.
 * Pure UI — logic in useCampaignEndModal.
 */
import styles from './styles.module.css'
import { ComponentProps } from "react"
import Modal from "../../Modal/Modal"
import Icon from '../../Icon/Icon'
import { useCampaignEndModal } from './useCampaignEndModal'

const CampaignEndModal = ({ open, closeFn }: Omit<ComponentProps<typeof Modal>, 'children'>) => {
    const { chromeStoreLink, labels } = useCampaignEndModal()

    return (
        <Modal
            open={open}
            closeFn={closeFn}
        >
            <div className={styles.modal}>
                <Icon name="download.svg" alt="wallet icon" />
                <div className={styles.title}>{labels.title}</div>
                {/* The copy breaks its own line, so the style keeps the \n. */}
                <div className={styles.subtitle}>{labels.message}</div>
                <a
                    id="campaign-end-modal-install-btn"
                    className={styles.btn}
                    href={chromeStoreLink}
                    target='_blank'
                >{labels.install}</a>
            </div>
        </Modal>
    )
}

export default CampaignEndModal
