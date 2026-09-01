/**
 * Logic hook for the mobile Pair Wallet flow, driving the three
 * `/v1/auth/pair/*` endpoints (see src/api/pair.ts):
 *
 *   email  → pairInitiate   → OTP mailed, Cognito `session` + `codeLength` back
 *   code   → pairVerifyOtp  → `nonce` + the text the wallet must sign
 *            SIGN_MESSAGE   → the wallet answers with `SIGNATURE`; the code
 *                             screen stays put (busy) while the wallet prompts
 *            pairConfirm    → pair persisted
 *
 * Owns the step machine, the field state and the signature round-trip, so the
 * view stays pure UI.
 */
import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import message from '../../utils/message'
import { pairInitiate, pairVerifyOtp, pairConfirm, PairReason } from '../../api/pair'

export type PairStep = 'email' | 'code' | 'success' | 'error'

export interface PairWalletModalProps {
    open: boolean
    onClose: () => void
}

/** Fallback until `/pair/initiate` reports the real length (always 8 for
 *  pairing — it only ever takes the sign-in path). */
const DEFAULT_CODE_LENGTH = 8

/** Kept identical to the backend's `EMAIL_REGEX` (`@utils/email`) — a stricter
 *  client check would reject addresses the API accepts. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Reasons shown inline under the code inputs; everything else is fatal for
 *  the attempt and takes over the whole sheet. */
const INLINE_CODE_REASONS: PairReason[] = ['wrong_code', 'expired', 'session_invalid']

const CODE_ERROR_KEYS: Partial<Record<PairReason, string>> = {
    wrong_code: 'pairCodeInvalid',
    expired: 'pairCodeExpired',
    session_invalid: 'pairSessionInvalid',
}

const FATAL_ERROR_KEYS: Partial<Record<PairReason, string>> = {
    email_not_registered: 'pairNotFound',
    address_already_paired: 'pairErrorAddressPaired',
    email_already_paired: 'pairErrorEmailPaired',
    address_has_rewards: 'pairErrorAddressHasRewards',
    already_paired: 'pairErrorAddressPaired',
    too_many_attempts: 'pairErrorTooMany',
    invalid_address: 'pairErrorNoWallet',
    signature_mismatch: 'pairErrorSignature',
    nonce_invalid: 'pairErrorExpiredSession',
    network_error: 'pairErrorNetwork',
}

const emptyCode = (length: number) => Array<string>(length).fill('')

// ── TEMPORARY, dev only ──────────────────────────────────────────────────
// Every screen of the flow, with the Figma node it mirrors, for the dev
// picker. Delete with DevStepPicker.tsx and `devJump` below.
export const DEV_SCREENS = [
    ['email', 'Email', '278-5033'],
    ['emailFilled', 'Email·typed', '278-5002'],
    ['emailInvalid', 'Email·error', '278-4995'],
    ['code', 'Code', '278-5009'],
    ['codeFilled', 'Code·typed', '278-5025'],
    ['codeInvalid', 'Code·error', '278-5017'],
    ['error', 'Not found', '278-5473'],
    ['success', 'Paired', '278-5040'],
] as const

export type DevScreen = (typeof DEV_SCREENS)[number][0]

const DEV_SCREEN_STEP: Record<DevScreen, PairStep> = {
    email: 'email',
    emailFilled: 'email',
    emailInvalid: 'email',
    code: 'code',
    codeFilled: 'code',
    codeInvalid: 'code',
    error: 'error',
    success: 'success',
}
// ─────────────────────────────────────────────────────────────────────────

export const usePairWalletModal = ({ open }: PairWalletModalProps) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { flowId, platform } = useRouteLoaderData('root') as LoaderData
    // The context, not the loader: the address is re-seeded on SESSION_UPDATE
    // when the user switches wallets mid-session.
    const { walletAddress } = useWalletAddress()

    const [step, setStep] = useState<PairStep>('email')
    const [email, setEmailValue] = useState('')
    const [emailErrorKey, setEmailErrorKey] = useState<string | null>(null)
    const [codeLength, setCodeLength] = useState<number>(DEFAULT_CODE_LENGTH)
    const [code, setCode] = useState<string[]>(() => emptyCode(DEFAULT_CODE_LENGTH))
    const [codeErrorKey, setCodeErrorKey] = useState<string | null>(null)
    const [fatalErrorKey, setFatalErrorKey] = useState<string>('pairErrorGeneric')
    const [busy, setBusy] = useState(false)
    // Set when Pair was blocked on a missing address and a LOGIN was sent;
    // the address arriving resumes the attempt (same as the desktop portal's
    // `reopenAfterConnect` in RetailerCard).
    const [awaitingWallet, setAwaitingWallet] = useState(false)
    const digitRefs = useRef<(HTMLInputElement | null)[]>([])
    // The Cognito session and the pair nonce never render, so they live in refs
    // — a re-render mid-flow must not race them.
    const sessionRef = useRef('')
    const nonceRef = useRef('')
    // Gates the window `message` listener: without it the Home page's claim
    // listener and this one would both answer the same SIGNATURE event.
    const awaitingSignatureRef = useRef(false)

    const resetFlow = (length = DEFAULT_CODE_LENGTH) => {
        setCodeLength(length)
        setCode(emptyCode(length))
        setCodeErrorKey(null)
        sessionRef.current = ''
        nonceRef.current = ''
        awaitingSignatureRef.current = false
    }

    // Reopening always starts a fresh pairing attempt.
    useEffect(() => {
        if (open) return
        setStep('email')
        setEmailValue('')
        setEmailErrorKey(null)
        setBusy(false)
        setAwaitingWallet(false)
        resetFlow()
    }, [open])

    const failWith = (reason: PairReason) => {
        setFatalErrorKey(FATAL_ERROR_KEYS[reason] ?? 'pairErrorGeneric')
        setStep('error')
    }

    const setEmail = (value: string) => {
        setEmailValue(value)
        setEmailErrorKey(null)
    }

    const goToEmail = () => {
        setStep('email')
        setBusy(false)
        resetFlow()
    }

    /** Shared by the Pair button and Resend code — `/pair/initiate` restarts
     *  the challenge and re-runs every precondition, so resending is the same
     *  call (and the same rate-limit counters). */
    const startChallenge = async (nextStep: PairStep) => {
        if (busy) return
        setBusy(true)
        const res = await pairInitiate({
            platform,
            flowId,
            email: email.trim().toLowerCase(),
            address: walletAddress ?? '',
        })
        setBusy(false)

        if (!res.ok) {
            // A bad email shape is the one failure the email screen shows inline.
            if (res.reason === 'invalid_email') {
                setEmailErrorKey('pairEmailInvalid')
                return
            }
            failWith(res.reason)
            return
        }

        resetFlow(res.codeLength)
        // After resetFlow, which is what clears the ref. A resend issues a
        // fresh Cognito session and the ref must hold the newest one.
        sessionRef.current = res.session
        setStep(nextStep)
    }

    const submitEmail = () => {
        // Same shape the backend's normalizeEmail enforces — checked here too
        // so a typo costs no round-trip and no rate-limit allowance.
        if (!EMAIL_RE.test(email.trim().toLowerCase())) {
            setEmailErrorKey('pairEmailInvalid')
            return
        }
        // No address yet: ask the wallet to connect rather than dead-ending.
        // The typed email is kept, and the effect below resumes once the
        // address lands via SESSION_UPDATE. A dismissed prompt just leaves the
        // button tappable again — the wallet sends nothing on cancel.
        if (!walletAddress) {
            setAwaitingWallet(true)
            message({ action: 'LOGIN' })
            return
        }
        startChallenge('code')
    }

    useEffect(() => {
        if (!awaitingWallet || !walletAddress) return
        setAwaitingWallet(false)
        startChallenge('code')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [awaitingWallet, walletAddress])

    const resendCode = () => {
        digitRefs.current[0]?.focus()
        startChallenge('code')
    }

    const submitCode = async () => {
        if (busy || code.join('').length < codeLength) return
        setBusy(true)
        const res = await pairVerifyOtp({
            platform,
            flowId,
            email: email.trim().toLowerCase(),
            address: walletAddress ?? '',
            code: code.join(''),
            session: sessionRef.current,
        })

        if (!res.ok) {
            setBusy(false)
            // Cognito sessions are single-use — it re-issues one on a wrong
            // code and the stored value MUST be replaced before the retry.
            if (res.session) sessionRef.current = res.session
            if (INLINE_CODE_REASONS.includes(res.reason)) {
                setCodeErrorKey(CODE_ERROR_KEYS[res.reason] ?? 'pairCodeInvalid')
                return
            }
            failWith(res.reason)
            return
        }

        // Email proved. Now prove the address: the wallet signs the text the
        // server rebuilds from the nonce row on confirm. The wallet owns the
        // screen while it prompts, so the code step stays as it is — `busy`
        // holds until the answer lands, so nothing is submitted twice.
        nonceRef.current = res.nonce
        awaitingSignatureRef.current = true
        message({ action: 'SIGN_MESSAGE', messageToSign: res.message })
    }

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.to !== 'bringweb3' || event.origin === window.location.origin) return
            // Only the pairing signature — the claim flow listens for its own.
            if (!awaitingSignatureRef.current) return

            if (event.data.action === 'ABORT_SIGN_MESSAGE') {
                awaitingSignatureRef.current = false
                setBusy(false)
                // The OTP session is spent, so there is no cheap way back to
                // the code screen: the attempt restarts from the email.
                setFatalErrorKey('pairErrorCancelled')
                setStep('error')
                return
            }

            if (event.data.action !== 'SIGNATURE') return
            awaitingSignatureRef.current = false

            const res = await pairConfirm({
                platform,
                flowId,
                nonce: nonceRef.current,
                signature: event.data.signature,
            })
            setBusy(false)

            if (!res.ok) {
                failWith(res.reason)
                return
            }

            // Rewards earned under the email are shared with the address from
            // now on (resolveRewardIdentities), so the balance is stale.
            queryClient.invalidateQueries({ queryKey: ['balance', walletAddress] })
            setStep('success')
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [platform, flowId, queryClient, walletAddress])

    /** Writes `digits` from `index` on and parks the caret after the last one. */
    const fillFrom = (index: number, digits: string) => {
        setCode(prev => {
            const next = [...prev]
            for (let i = 0; i < digits.length && index + i < prev.length; i++) {
                next[index + i] = digits[i]
            }
            return next
        })
        setCodeErrorKey(null)
        digitRefs.current[Math.min(index + digits.length, codeLength - 1)]?.focus()
    }

    /** Paste, autofill and soft keyboards, which do not report a usable `key`.
     *  A box already holding a digit sends its old value along with the new
     *  one, so only the tail — what is actually new — is written. */
    const handleDigitChange = (index: number, value: string) => {
        const digits = value.replace(/\D/g, '')
        if (!digits) {
            setCode(prev => prev.map((d, i) => (i === index ? '' : d)))
            return
        }
        const typed = code[index] && digits.length > 1 ? digits.slice(1) : digits
        fillFrom(index, typed)
    }

    /** Physical keyboards: a digit overwrites the box whatever it already holds
     *  and moves on, so retyping over a filled code never needs a select first
     *  (`maxLength` would otherwise swallow the keystroke). */
    const handleDigitKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (/^\d$/.test(e.key)) {
            e.preventDefault()
            fillFrom(index, e.key)
            return
        }
        if (e.key === 'Backspace' && !code[index]) digitRefs.current[index - 1]?.focus()
    }

    // ── TEMPORARY, dev only ──────────────────────────────────────────────
    // Jumps straight to any screen so each one can be held against Figma
    // without walking the real flow. Delete this block together with
    // DevStepPicker.tsx once the pairing designs are signed off.
    const devJump = (name: DevScreen) => {
        setEmailErrorKey(null)
        setCodeErrorKey(null)
        setBusy(false)
        if (name === 'email') setEmailValue('')
        if (name === 'emailFilled') setEmailValue('priya@gmail.com')
        if (name === 'emailInvalid') {
            setEmailValue('priya@gmail.cofgn')
            setEmailErrorKey('pairEmailInvalid')
        }
        if (name === 'code') setCode(emptyCode(codeLength))
        if (name === 'codeFilled' || name === 'codeInvalid') {
            setCode(Array<string>(codeLength).fill('8'))
        }
        if (name === 'codeInvalid') setCodeErrorKey('pairCodeInvalid')
        if (name === 'error') setFatalErrorKey('pairNotFound')
        setStep(DEV_SCREEN_STEP[name])
    }
    // ─────────────────────────────────────────────────────────────────────

    return {
        step,
        busy,
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
        email,
        setEmail,
        emailError: emailErrorKey ? t(emailErrorKey) : null,
        submitEmail,
        canSubmitEmail: email.trim().length > 0,
        code,
        codeError: codeErrorKey ? t(codeErrorKey) : null,
        digitRefs,
        handleDigitChange,
        handleDigitKeyDown,
        canSubmitCode: code.join('').length === codeLength,
        submitCode,
        resendCode,
        fatalError: t(fatalErrorKey),
        goToEmail,
        // TEMPORARY, dev only — see DevStepPicker.tsx.
        devJump,
    }
}
