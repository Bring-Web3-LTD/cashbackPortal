/**
 * Logic hook for the "What's This?" sheet (Figma 278:3244). Owns the labels
 * and the close handler — the view stays pure UI.
 */
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const useWhatsThis = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

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
        // ponytail: the design gives no destination for the CTA, so it just
        // dismisses the sheet. Point it at the wallet download URL once there is one.
        onDownloadWallet: close,
    }
}
