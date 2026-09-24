/**
 * View adapter for the mobile Pair Wallet sheet. Holds no flow logic of its
 * own — it wires three pieces together:
 *
 *   usePairWallet  the pairing flow (steps, the three /v1/auth/pair/* calls,
 *                  the signature round-trip). No DOM, no i18n.
 *   useOtpInputs   the code-box refs and caret behaviour.
 *   useTranslation turns the flow's error *keys* into rendered strings.
 *
 * A desktop Pair Wallet view imports usePairWallet directly and does its own
 * two lines of wiring; nothing here is in its way.
 */
import { useTranslation } from 'react-i18next'
import { usePairWallet } from '../../hooks/usePairWallet'
import { useOtpInputs } from './useOtpInputs'

export type { PairStep } from '../../hooks/usePairWallet'

export interface PairWalletModalProps {
    open: boolean
    onClose: () => void
}

export const usePairWalletModal = ({ open }: PairWalletModalProps) => {
    const { t } = useTranslation()
    const pair = usePairWallet({ open })
    const otp = useOtpInputs({
        code: pair.code,
        setCode: pair.setCode,
        length: pair.codeLength,
        onEdit: pair.clearCodeError,
    })

    return {
        step: pair.step,
        busy: pair.busy,
        labels: {
            title: t('pairWallet'),
            emailTitle: t('pairEmailTitle'),
            emailPlaceholder: t('pairEmailPlaceholder'),
            submitEmail: t('pairSubmitEmail'),
            codeTitle: t('pairCodeTitle'),
            resendCode: t('pairResendCode'),
            confirm: t('confirm'),
            tryAgain: t('tryAgain'),
            successTitle: t('pairSuccessTitle'),
            close: t('close'),
            back: t('back'),
        },
        email: pair.email,
        setEmail: pair.setEmail,
        emailError: pair.emailErrorKey ? t(pair.emailErrorKey) : null,
        submitEmail: pair.submitEmail,
        canSubmitEmail: pair.canSubmitEmail,
        code: pair.code,
        codeError: pair.codeErrorKey ? t(pair.codeErrorKey) : null,
        digitRefs: otp.digitRefs,
        handleDigitChange: otp.handleDigitChange,
        handleDigitKeyDown: otp.handleDigitKeyDown,
        canSubmitCode: pair.canSubmitCode,
        submitCode: pair.submitCode,
        // The caret goes back to the first box before the new code lands.
        resendCode: () => {
            otp.focusFirst()
            pair.resendCode()
        },
        fatalError: t(pair.fatalErrorKey),
        goToEmail: pair.goToEmail,
        // TEMP QA nav — remove before merge.
        debugSetStep: pair.debugSetStep,
    }
}
