import { useEffect, useState, type FormEvent } from 'react'
import { useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { googleSignIn, otpSend, otpVerify } from '../../api/signIn'
import { requestGoogleCode } from '../../utils/google'
import { flowId } from '../../utils/flow'
import { clickId } from '../../utils/clickId'
import { campaignId } from '../../utils/campaignId'
import { markFunnelCompleted, trackPageView } from '../../utils/rhAnalytics'

export type Step = 'email' | 'code'

// Seconds the user waits after a code is sent before "Resend code" unlocks
const RESEND_COOLDOWN = 60

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

// Fallback only: the token carries the platform's own Terms of Use (`bringTou`)
const TERMS_OF_USE_URL = 'https://bring.network/termsofuse'

// The sign-up / sign-in flow of the landing pages (useRegister.ts there), on
// the portal's transport: same steps, same copy, same errors. A verified
// sign-in sets the session cookies, so success reloads the page and the
// portal opens on the email identity instead of showing a success screen.
export default function useRegister() {
  const { platform, bringTou } = useRouteLoaderData('root') as LoaderData
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('email')
  const [session, setSession] = useState('')
  const [email, setEmail] = useState('')
  const [digits, setDigits] = useState<string[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  // Owns the email field's red ring. Separate from `error` because the two do
  // not always coincide: a client-side invalid address rings the field with no
  // message (the design's email error state has none), and a Google sign-in
  // failure is the reverse - a message, but nothing wrong with what was typed.
  const [emailInvalid, setEmailInvalid] = useState(false)
  // Seconds left until resend is allowed again; ticks down to 0
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    trackPageView()
  }, [])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  const genericError = t('signInErrorGeneric', 'Something went wrong. Please try again.')

  // Failure reasons returned by POST /otp/verify
  const reasonMessage = (reason?: string): string => {
    switch (reason) {
      case 'wrong_code':
        return t('signInErrorWrongCode', 'Invalid code. Please try again.')
      case 'expired':
        return t('signInErrorExpired', 'That code has expired. Please resend a new one.')
      case 'session_invalid':
        return t('signInErrorSessionInvalid', 'This code is no longer valid. Please resend a new one.')
      default:
        return genericError
    }
  }

  const errorMessage = (err: unknown): string =>
    err instanceof Error ? err.message : genericError

  // Platform, visit and attribution fields every sign-in call carries
  const baseBody = {
    platform,
    flowId,
    ...(campaignId && { id: campaignId }),
    ...(clickId && { clickId }),
  }

  // Shared by send + resend. Returns the new opaque session and the code
  // length (6-digit sign-up vs 8-digit sign-in, decided server-side).
  const apiSendCode = async () => {
    const res = await otpSend({ ...baseBody, email })
    if (res.status === 429) {
      throw new Error(t('signInErrorTooMany', 'Too many attempts. Please wait a bit and try again.'))
    }
    if (!res.ok) {
      throw new Error(genericError)
    }
    const data: { session: string; codeLength: number } = await res.json()
    setSession(data.session)
    setDigits(Array(data.codeLength).fill(''))
    setResendIn(RESEND_COOLDOWN)
  }

  const sendCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // The form is noValidate (the native browser bubble is not the design's
    // error state); invalid input turns the field red instead
    if (!isValidEmail(email)) {
      setEmailInvalid(true)
      return
    }
    setBusy(true)
    setError('')
    try {
      await apiSendCode()
      setNotice('')
      setStep('code')
    } catch (err) {
      // This one IS about the address in the field, so it rings too
      setEmailInvalid(true)
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  // The session cookies are set by the response; a reload re-runs the root
  // loader, whose /check/portal now returns the JWT of the email identity.
  const enterPortal = () => {
    // Leaving the screen is not an abandonment - stop reporting close events
    markFunnelCompleted()
    window.location.reload()
  }

  const confirmCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await otpVerify({ ...baseBody, email, code: digits.join(''), session })
      if (!res.ok) {
        // Cognito sessions are single-use: the retry must use the fresh one
        const data: { reason?: string; session?: string } = await res
          .json()
          .catch(() => ({}))
        if (data.session) setSession(data.session)
        throw new Error(reasonMessage(data.reason))
      }
      enterPortal()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  // Google Sign-In: one call, no OTP step. Google's ID token already proves the
  // address. What travels from here is only the popup's one-time authorization
  // code - the backend exchanges it, verifies the ID token and opens the
  // session for the address it trusts.
  const continueWithGoogle = async () => {
    // null when the visitor declines or closes the popup: their answer, the
    // button stays put and a second click retries
    const code = await requestGoogleCode()
    if (!code) return
    setBusy(true)
    setError('')
    try {
      const res = await googleSignIn({ ...baseBody, code })
      if (!res.ok) {
        throw new Error(genericError)
      }
      enterPortal()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const resend = async () => {
    setBusy(true)
    setError('')
    try {
      await apiSendCode()
      setNotice(t('signInNoticeResent', 'A new code is on its way.'))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const updateEmail = (value: string) => {
    setEmail(value)
    setError('')
    setEmailInvalid(false)
  }

  const updateDigits = (value: string[]) => {
    setDigits(value)
    setError('')
  }

  // Header back: code step returns to the email step. The email step has
  // nothing before it, so no back button there.
  const goBack =
    step === 'code'
      ? () => {
          setError('')
          setStep('email')
        }
      : undefined

  const resendCountdown = `${Math.floor(resendIn / 60)}:${String(resendIn % 60).padStart(2, '0')}`

  const labels = {
    back: t('signInBack', 'Back'),
    emailTitle: t('signInEmailTitle', 'Enter your email'),
    emailSubtitle: t('signInEmailSubtitle', "We'll send a verification code to your inbox."),
    google: t('signInWithGoogle', 'Sign in with Google'),
    or: t('or', 'or'),
    emailPlaceholder: t('signInEmailPlaceholder', 'Email address'),
    sendCode: t('signInSendCode', 'Send code'),
    sending: t('signInSending', 'Sending…'),
    legalText: t('signInLegalText', 'By clicking you agree to the'),
    termsOfUse: t('signInTermsOfUse', 'Terms of Use'),
    termsOfUseUrl: bringTou || TERMS_OF_USE_URL,
    codeTitle: t('signInCodeTitle', 'Enter code'),
    codeSubtitle: t('signInCodeSubtitle', 'Enter the {{n}}-digit code we sent to', { n: digits.length }),
    verify: t('signInVerify', 'Verify'),
    verifying: t('signInVerifying', 'Verifying…'),
    resend: resendIn > 0
      ? t('signInResendIn', 'Resend code in {{time}}', { time: resendCountdown })
      : t('signInResend', 'Resend code'),
    digit: (i: number) => t('signInDigit', 'Digit {{n}}', { n: i + 1 }),
  }

  return {
    step,
    email,
    digits,
    error,
    emailInvalid,
    notice,
    busy,
    resendIn,
    labels,
    updateEmail,
    updateDigits,
    sendCode,
    confirmCode,
    continueWithGoogle,
    resend,
    goBack,
  }
}
