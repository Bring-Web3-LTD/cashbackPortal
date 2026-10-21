/**
 * Logic hook for the desktop pair-wallet modal. Composes the shared flow and
 * the OTP inputs, owns the submit handler and the focus the code step needs,
 * and resolves the labels — so the view is pure UI.
 *
 * The flow itself (validation, API round-trips) stays in usePairWallet, which
 * the mobile sheet shares.
 */
import { FormEvent, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usePairWallet } from './usePairWallet'
import { useOtpInputs } from './useOtpInputs'

export const usePairWalletModal = (open: boolean) => {
    const { t } = useTranslation()
    const flow = usePairWallet({ open })
    const { step, code, setCode, codeLength, clearCodeError, codeErrorKey, submitCode, submitEmail } = flow

    const otp = useOtpInputs({
        code,
        setCode,
        length: codeLength,
        onEdit: clearCodeError,
    })

    const isCode = step === 'code'

    // The code arrives by mail, so the user comes back to this screen from
    // another window — put the caret where they need it.
    useEffect(() => {
        if (isCode) otp.focusFirst()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCode])

    return {
        ...flow,
        ...otp,
        isCode,
        submit: (e: FormEvent) => {
            e.preventDefault()
            if (isCode) submitCode()
            else submitEmail()
        },
        // The key is chosen by the flow, so the view never resolves one itself.
        codeError: codeErrorKey ? t(codeErrorKey) : '',
        labels: {
            enterCode: t('enterCode'),
            pairWallet: t('pairWallet'),
            signInWithGoogle: t('signInWithGoogle'),
            or: t('or'),
            emailPlaceholder: t('emailPlaceholder'),
            resendCode: t('resendCode'),
            submit: t(isCode ? 'confirm' : 'pair'),
        },
    }
}
