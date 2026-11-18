/**
 * Logic hook for the "What's This?" sheet (Figma 278:3244). Owns the labels
 * and the close handler — the view stays pure UI.
 *
 * Two modes (Figma 3590:2482): Hybrid (coupons enabled) shows the intro and
 * three cards; Cashback (coupons disabled) is titled "Cashback", has no
 * intro, and drops the Coupons card.
 */
import { useNavigate, useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const useWhatsThis = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { chromeStoreUrl, isHub, noClaim, couponsEnabled } = useRouteLoaderData('root') as LoaderData

    const close = () => navigate('/')
    const goHome = () => navigate('/')

    return {
        labels: {
            title: couponsEnabled ? t('whatsThisTitle') : t('whatsThisCashbackTitle'),
            intro: couponsEnabled ? t('whatsThisIntro') : null,
            downloadWallet: t('downloadWallet'),
            gotIt: t('gotIt'),
        },
        cards: [
            ...(couponsEnabled ? [{ icon: 'scissors.svg', title: t('coupons'), text: t('whatsThisCoupons') }] : []),
            { icon: 'shopping-bag.svg', title: t('cashback'), text: t('whatsThisCashback') },
            // A noClaim platform pays out itself: the claim card explains that.
            noClaim
                ? { icon: 'wallet.svg', title: t('noClaimTitle'), text: t('noClaimText') }
                : { icon: 'wallet.svg', title: t('claim'), text: t('whatsThisClaim') },
        ],
        close,
        goHome,
        isHub: !!isHub,
        downloadUrl: chromeStoreUrl,
    }
}
