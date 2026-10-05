/**
 * Logic hook for the What's This modal. Resolves the three cards and the
 * labels, and borrows the claim action from the shared flow — so the view is
 * pure UI.
 */
import { useTranslation } from 'react-i18next'
import { useClaim } from '../../../hooks/useClaim'

const CARDS = ['coupons', 'cashback', 'claim'] as const

export const useExplainModal = (closeFn: () => void) => {
    const { t } = useTranslation()
    // The same action the claimable card's button runs, off the same rule for
    // when it is available - so the two cannot disagree.
    const { claim, claimDisabled } = useClaim()

    return {
        cards: CARDS.map(card => ({
            key: card,
            icon: `explain-${card}.svg`,
            title: t(`explain_${card}_title`),
            text: t(`explain_${card}_text`),
        })),
        claimDisabled,
        claimAndClose: () => { claim(); closeFn() },
        labels: {
            title: t('explainTitle'),
            subtitle: t('explainSubtitle'),
            claimCashback: t('claimCashback'),
        },
    }
}
