/**
 * Wallet ↔ email pairing — the flow itself, with no view attached.
 *
 *   email  → pairInitiate   → OTP mailed, Cognito `session` + `codeLength` back
 *   code   → pairVerifyOtp  → `nonce` + the text the wallet must sign
 *            SIGN_MESSAGE   → the wallet answers with `SIGNATURE`; the code
 *                             step stays put (busy) while the wallet prompts
 *            pairConfirm    → pair persisted
 *
 * Owns the step machine, the field state and the signature round-trip. It
 * renders nothing, touches no DOM node and translates no string: errors come
 * out as i18n *keys* and the caller decides how to show them. That keeps it
 * importable by any view — the mobile sheet, a desktop modal — since every
 * hook it depends on (`root` loader, WalletProvider, QueryClientProvider) is
 * mounted above the mobile/desktop split in Layout and main.
 *
 * Input mechanics for the OTP boxes live in useOtpInputs; the mobile sheet's
 * wiring of the two lives in usePairWalletModal.
 */
import { useEffect, useRef, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import message from '../../utils/message'
import { pairInitiate, pairVerifyOtp, pairConfirm, PairReason } from '../../api/pair'
import { ENV } from '../../config'

export type PairStep = 'email' | 'code' | 'success' | 'error'

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

/**
 * Screens the dev wrapper can jump to, so a state can be held against its
 * design without walking the real flow (which needs a registered email, a live
 * OTP and a wallet signature). Driven from outside the bundle: the wrapper
 * posts PAIR_DEV_SCREEN and nothing here ships to production but this map.
 */
export type DevScreen =
    | 'email' | 'emailFilled' | 'emailInvalid'
    | 'code' | 'codeFilled' | 'codeInvalid'
    | 'error' | 'success'

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

/** `open` drives the reset: closing the sheet abandons the attempt. */
export const usePairWallet = ({ open }: { open: boolean }) => {
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
    // Set when the attempt was blocked on a missing address and a LOGIN was
    // sent; the address arriving resumes it (same as the desktop portal's
    // `reopenAfterConnect` in RetailerCard).
    const [awaitingWallet, setAwaitingWallet] = useState(false)
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
                // What the wallet says it signed, and the key it signed with —
                // same fields claim-submit forwards.
                message: event.data.message,
                ...(event.data.key ? { key: event.data.key } : {}),
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

    const clearCodeError = () => setCodeErrorKey(null)

    // Jumps to a screen on the dev wrapper's request. Prod never registers the
    // listener, so the picker cannot be driven against a real session.
    useEffect(() => {
        if (ENV === 'prod') return

        const handleDevScreen = (event: MessageEvent) => {
            if (event.source !== window.parent) return
            const { to, action, screen } = event.data ?? {}
            if (to !== 'bringweb3' || action !== 'PAIR_DEV_SCREEN') return
            if (!(screen in DEV_SCREEN_STEP)) return
            const name = screen as DevScreen

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

        window.addEventListener('message', handleDevScreen)
        return () => window.removeEventListener('message', handleDevScreen)
    }, [codeLength])

    return {
        step,
        busy,
        email,
        setEmail,
        /** i18n key, not a rendered string — the view translates. */
        emailErrorKey,
        submitEmail,
        canSubmitEmail: email.trim().length > 0,
        /** One entry per box; a view with a single field can join/split it. */
        code,
        setCode,
        codeLength,
        codeErrorKey,
        clearCodeError,
        canSubmitCode: code.join('').length === codeLength,
        submitCode,
        resendCode,
        fatalErrorKey,
        goToEmail,
    }
}
