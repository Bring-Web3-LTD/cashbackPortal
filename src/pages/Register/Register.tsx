import FlowLayout from '../../components/FlowLayout/FlowLayout'
import OtpBoxes from '../../components/OtpBoxes/OtpBoxes'
import LegalLinks from '../../components/LegalLinks/LegalLinks'
import GoogleButton from '../../components/GoogleButton/GoogleButton'
import OrDivider from '../../components/OrDivider/OrDivider'
import useRegister from './useRegister'
import form from '../../styles/form.module.css'
import styles from './Register.module.css'
import '../../styles/fonts.css'

// The landing pages' sign-up / sign-in screen (Register.tsx there), shown in
// standalone mode until the session is verified. Identical markup and styles;
// only the success screen is gone - a verified sign-in opens the portal.
export default function Register() {
  const r = useRegister()
  const busy = r.busy
  const l = r.labels

  let body: React.ReactNode

  if (r.step === 'code') {
    body = (
      <form
        className={`${styles.form} ${styles.formWide}`}
        onSubmit={r.confirmCode}
        style={{ '--code-count': r.digits.length } as React.CSSProperties}
      >
        <h1 className={form.title}>{l.codeTitle}</h1>
        <p className={`${form.subtitle} ${styles.codeSubtitle}`}>
          {l.codeSubtitle}{' '}
          <span className={form.email}>{r.email}</span>
        </p>
        <OtpBoxes
          digits={r.digits}
          onChange={r.updateDigits}
          hasError={!!r.error}
          digitLabel={l.digit}
        />
        {/* Always mounted: the design reserves the feedback line's space in
            every state (hidden ErrorMessage node in the non-error frames), so
            the row and buttons never move when a message appears. */}
        <p
          className={`${r.error ? form.error : form.notice} ${styles.codeFeedback}`}
          aria-live="polite"
        >
          {r.error || r.notice || ' '}
        </p>
        <button
          type="submit"
          className={`${form.btn} ${styles.codeAction}`}
          disabled={busy || r.digits.some((d) => !d)}
        >
          {r.busy ? (
            l.verifying
          ) : (
            <>
              {l.verify} <span className={form.btnArrow} aria-hidden="true" />
            </>
          )}
        </button>
        <button
          type="button"
          className={`${form.link} ${styles.resend}${r.resendIn > 0 ? ` ${styles.resendCounting}` : ''}`}
          onClick={r.resend}
          disabled={busy || r.resendIn > 0}
        >
          {l.resend}
        </button>
      </form>
    )
  } else {
    body = (
      <form
        className={`${styles.form} ${styles.emailForm}`}
        onSubmit={r.sendCode}
        noValidate
      >
        <h1 className={form.title}>{l.emailTitle}</h1>
        <p className={`${form.subtitle} ${styles.emailSubtitle}`}>
          {l.emailSubtitle}
        </p>
        <GoogleButton label={l.google} onClick={r.continueWithGoogle} disabled={busy} />
        <OrDivider label={l.or} />
        <input
          className={`${form.input}${r.emailInvalid ? ` ${form.inputError}` : ''}`}
          type="email"
          autoComplete="email"
          placeholder={l.emailPlaceholder}
          aria-label={l.emailPlaceholder}
          value={r.email}
          onChange={(e) => r.updateEmail(e.target.value)}
          required
          autoFocus
        />
        {r.error && <p className={`${form.error} ${styles.narrow}`}>{r.error}</p>}
        <button type="submit" className={form.btn} disabled={busy || !r.email}>
          {r.busy ? (
            l.sending
          ) : (
            <>
              {l.sendCode} <span className={form.btnArrow} aria-hidden="true" />
            </>
          )}
        </button>
        <LegalLinks text={l.legalText} linkText={l.termsOfUse} href={l.termsOfUseUrl} />
      </form>
    )
  }

  return (
    <FlowLayout onBack={r.goBack} backLabel={l.back}>
      {body}
    </FlowLayout>
  )
}
