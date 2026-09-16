/**
 * Logic hook for the "What's This?" sheet (Figma 278:3244). Owns the labels
 * and the close handler — the view stays pure UI.
 */
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const useWhatsThis = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { chromeStoreUrl } = useRouteLoaderData('root') as LoaderData

    const close = () => navigate(-1)

    return {
        labels: {
            title: t('whatsThisTitle'),
            intro: t('whatsThisIntro'),
            downloadWallet: t('downloadWallet'),
        },
        cards: [
            { icon: 'scissors.svg', title: t('coupons'), text: t('whatsThisCoupons') },
            { icon: 'shopping-bag.svg', title: t('cashback'), text: t('whatsThisCashback') },
            { icon: 'wallet.svg', title: t('claim'), text: t('whatsThisClaim') },
        ],
        close,
        downloadUrl: chromeStoreUrl,
    }
}
