/**
 * Logic hook for the campaign-ended modal. Resolves the campaign behind the
 * URL's id, picks the message that matches it and the store link — so the
 * view is pure UI.
 */
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData, useSearchParams } from 'react-router-dom'
import { getCampaign, parseCampaignId } from '../../../utils/campaigns'
import formatCashback from '../../../utils/formatCashback'

export const useCampaignEndModal = () => {
    const { t } = useTranslation()
    const { platform } = useRouteLoaderData('root') as LoaderData
    const [params] = useSearchParams()

    const campaignKey = parseCampaignId(params.get('campaignId'))
    const campaign = campaignKey ? getCampaign(platform, campaignKey.id, campaignKey.hash) : null

    return {
        chromeStoreLink: t('chromeStoreLink'),
        labels: {
            title: t('campaignEndTitle'),
            // Without a campaign behind the id there is no deal to name, so the
            // message covers a sold-out deal and an unavailable country alike.
            message: campaign
                ? t('campaignEndMsg', {
                    amount: formatCashback(+campaign.amount, campaign.symbol, 'USD'),
                    name: campaign.name,
                })
                : t('campaignEndMsgNoCampaign'),
            install: t('campaignEndBtn'),
        },
    }
}
