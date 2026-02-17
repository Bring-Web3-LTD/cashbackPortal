import styles from './styles.module.css'
import { ComponentProps } from "react"
import Modal from "../../Modal/Modal"
import { useRouteLoaderData, useSearchParams } from "react-router-dom"
import { useTranslation } from 'react-i18next'
import { getCampaign, parseCampaignId } from '../../../utils/campaigns'
import formatCashback from '../../../utils/formatCashback'

const CampaignEndModal = ({ open, closeFn }: Omit<ComponentProps<typeof Modal>, 'children'>) => {
    const { iconsPath, platform } = useRouteLoaderData('root') as LoaderData
    const [params] = useSearchParams()
    const { t } = useTranslation()
    const campaignKey = parseCampaignId(params.get('campaignId'))
    const campaign = campaignKey ? getCampaign(platform, campaignKey.id, campaignKey.hash) : null

    return (
        <Modal
            open={open}
            closeFn={closeFn}
        >
            <div className={styles.modal}>
                <img src={`${iconsPath}/download.svg`} alt="wallet icon" />
                <div className={styles.title}>Better luck next time!</div>
                <div className={styles.subtitle}>
                    {campaign ?
                        <>
                            The {formatCashback(+campaign.amount, campaign.symbol, 'USD')} cashback deal on {campaign.name} is sold out.<br />Install ready wallet now to catch the next one.
                        </>
                        :
                        <>
                            The deal is sold out or isn't available in your country.<br />Install Ready Wallet now to catch the next one.
                        </>
                    }
                </div>
                <a
                    id="campaign-end-modal-install-btn"
                    className={styles.btn}
                    href={`${t('chromeStoreLink')}`}
                    target='_blank'
                >Install Wallet</a>
            </div>
        </Modal>
    )
}

export default CampaignEndModal