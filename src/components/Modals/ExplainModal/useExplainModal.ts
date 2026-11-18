/**
 * Logic hook for the What's This modal. Resolves the cards and the labels —
 * so the view is pure UI.
 *
 * Two modes (Figma Core Components 201:119): Hybrid (coupons enabled) shows
 * the intro text and three cards; Cashback (coupons disabled) is titled
 * "Cashback", has no intro, and drops the Coupons card.
 */
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'

const CARDS = ['coupons', 'cashback', 'claim'] as const

export const useExplainModal = () => {
    const { t } = useTranslation()
    const { noClaim, couponsEnabled } = useRouteLoaderData('root') as LoaderData

    return {
        cards: CARDS.filter(card => couponsEnabled || card !== 'coupons').map(card => ({
            key: card,
            icon: `explain-${card}.svg`,
            // A noClaim platform pays out itself: the claim card explains that.
            title: noClaim && card === 'claim' ? t('noClaimTitle') : t(`explain_${card}_title`),
            text: noClaim && card === 'claim' ? t('noClaimText') : t(`explain_${card}_text`),
        })),
        labels: {
            title: couponsEnabled ? t('explainTitle') : t('explainCashbackTitle'),
            subtitle: couponsEnabled ? t('explainSubtitle') : null,
            gotIt: t('gotIt', 'Got it'),
        },
    }
}
