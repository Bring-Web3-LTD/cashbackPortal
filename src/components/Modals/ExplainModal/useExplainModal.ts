/**
 * Logic hook for the What's This modal. Resolves the three cards and the
 * labels, and borrows the claim action from the shared flow — so the view is
 * pure UI.
 */
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router-dom'
import { useClaim } from '../../../hooks/useClaim'

const CARDS = ['coupons', 'cashback', 'claim'] as const

export const useExplainModal = (closeFn: () => void) => {
    const { t } = useTranslation()
    const { noClaim } = useRouteLoaderData('root') as LoaderData
    // The same action the claimable card's button runs, off the same rule for
    // when it is available - so the two cannot disagree.
    const { claim, claimDisabled } = useClaim()

    return {
        cards: CARDS.map(card => ({
            key: card,
            icon: `explain-${card}.svg`,
            // A noClaim platform pays out itself: the claim card explains that.
            title: noClaim && card === 'claim' ? t('noClaimTitle') : t(`explain_${card}_title`),
            text: noClaim && card === 'claim' ? t('noClaimText') : t(`explain_${card}_text`),
        })),
        noClaim,
        claimDisabled,
        claimAndClose: () => { claim(); closeFn() },
        labels: {
            title: t('explainTitle'),
            subtitle: t('explainSubtitle'),
            claimCashback: t('claimCashback'),
        },
    }
}
