/**
 * Logic hook for the What's This modal. Resolves the three cards and the
 * labels — so the view is pure UI.
 */
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'

const CARDS = ['coupons', 'cashback', 'claim'] as const

export const useExplainModal = () => {
    const { t } = useTranslation()
    const { noClaim } = useRouteLoaderData('root') as LoaderData

    return {
        cards: CARDS.map(card => ({
            key: card,
            icon: `explain-${card}.svg`,
            // A noClaim platform pays out itself: the claim card explains that.
            title: noClaim && card === 'claim' ? t('noClaimTitle') : t(`explain_${card}_title`),
            text: noClaim && card === 'claim' ? t('noClaimText') : t(`explain_${card}_text`),
        })),
        labels: {
            title: t('explainTitle'),
            subtitle: t('explainSubtitle'),
            gotIt: t('gotIt', 'Got it'),
        },
    }
}
