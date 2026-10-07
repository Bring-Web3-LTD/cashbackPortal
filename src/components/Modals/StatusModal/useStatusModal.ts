/**
 * Logic hook for the status modal. Resolves every state's copy and wraps the
 * close so the host hears about it — so the view is pure UI.
 *
 * One hook for all six states rather than one per card: they are variants of
 * the same dialog, and the view picks between them on `status`.
 */
import { useTranslation } from 'react-i18next'
import message from '../../../utils/message'
import { shortenWalletAddress } from '../../../utils/claimFlow'

export const CLAIM_STEPS = [1, 2, 3, 4] as const

interface Args {
    closeFn: () => void
    address?: string | null
    usdValue?: string | number
    /** `pairFailed` only: key for the reason, defaulting to email-not-found. */
    messageKey?: string
}

export const useStatusModal = ({ closeFn, address, usdValue, messageKey }: Args) => {
    const { t } = useTranslation()

    return {
        close: () => {
            message({ action: 'POPUP_CLOSED' })
            closeFn()
        },
        claimSteps: CLAIM_STEPS.map(n => ({ n, text: t(`claimGuideStep${n}`) })),
        labels: {
            close: t('statusCloseBtn'),
            processingTitle: t('statusProcessingTitle'),
            processingMsg: t('statusProcessingMsg'),
            processingMsg2: t('statusProcessingMsg2'),
            successTitle: t('statusSuccessTitle'),
            successMsg: t('statusSuccessMsg', { address: shortenWalletAddress(address) }),
            errorTitle: t('statusErrorTitle'),
            errorMsg: t('statusErrorMsg'),
            pairSuccessTitle: t('pairSuccessTitle'),
            pairFailedMsg: t(messageKey ?? 'pairFailedMsg'),
            pairFailedBtn: t('pairFailedBtn'),
            claimBalance: t('claimGuideBalance'),
            claimBadge: t('claimGuideBadge'),
            // Empty when there is no value to show, so the view can skip the row.
            claimCurrentValue: usdValue ? t('claimGuideCurrentValue', { value: usdValue }) : '',
            claimTitle: t('claimGuideTitle'),
            claimCta: t('claimGuideCta'),
        },
    }
}

export type StatusLabels = ReturnType<typeof useStatusModal>['labels']
