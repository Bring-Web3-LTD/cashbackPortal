/** Mobile Pair Wallet flow (Figma 278:5033 → 278:5040): email → code →
 * paired / failed. Pure UI — logic in usePairWalletModal. */
import { createPortal } from 'react-dom'
import Icon from '../Icon/Icon'
import { usePairWalletModal, PairWalletModalProps } from './usePairWalletModal'
// TEMPORARY, dev only — delete with DevStepPicker.tsx.
import DevStepPicker from './DevStepPicker'
import styles from './styles.mobile.module.css'

const PairWalletModal = (props: PairWalletModalProps) => {
    const { open, onClose } = props
    const {
        step,
        busy,
        labels,
        email,
        setEmail,
        emailError,
        submitEmail,
        canSubmitEmail,
        code,
        codeError,
        digitRefs,
        handleDigitChange,
        handleDigitKeyDown,
        canSubmitCode,
        submitCode,
        resendCode,
        fatalError,
        goToEmail,
        devJump,
    } = usePairWalletModal(props)

    if (!open) return null

    // Back only exists once there's a previous step to return to; the success
    // sheet is terminal.
    const showBack = step === 'code' || step === 'error'
    const showClose = step !== 'success'

    return createPortal(
        <>
        <div className={styles.backdrop} onClick={onClose}>
            <section
                className={styles.panel}
                role="dialog"
                aria-modal="true"
                aria-label={labels.title}
                onClick={e => e.stopPropagation()}
            >
                <header className={styles.header}>
                    {showBack ? (
                        <button
                            type="button"
                            className={`${styles.headerBtn} ${styles.headerBtnBack}`}
                            onClick={goToEmail}
                            aria-label={labels.back}
                        >
                            <Icon name="arrow-left.svg" className={styles.headerIcon} alt="" />
                        </button>
                    ) : (
                        <span className={styles.headerSpacer} />
                    )}
                    <h2 className={styles.headerTitle}>{labels.title}</h2>
                    {showClose ? (
                        <button
                            type="button"
                            className={styles.headerBtn}
                            onClick={onClose}
                            aria-label={labels.close}
                        >
                            <Icon name="x-close.svg" className={styles.headerIcon} alt="" />
                        </button>
                    ) : (
                        <span className={styles.headerSpacer} />
                    )}
                </header>

                {step === 'email' ? (
                    <form
                        className={styles.content}
                        onSubmit={e => {
                            e.preventDefault()
                            submitEmail()
                        }}
                    >
                        <div className={styles.step}>
                            <h3 className={`${styles.stepTitle} ${styles.stepTitleNarrow}`}>
                                {labels.emailTitle}
                            </h3>
                            <div className={styles.field}>
                                <input
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    autoFocus
                                    className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                                    placeholder={labels.emailPlaceholder}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    aria-invalid={Boolean(emailError)}
                                    aria-label={labels.emailTitle}
                                />
                                {emailError ? (
                                    <p className={styles.errorText}>{emailError}</p>
                                ) : null}
                            </div>
                        </div>
                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={!canSubmitEmail || busy}
                        >
                            {labels.submitEmail}
                        </button>
                    </form>
                ) : null}

                {step === 'code' ? (
                    <form
                        className={styles.content}
                        onSubmit={e => {
                            e.preventDefault()
                            submitCode()
                        }}
                    >
                        <div className={styles.step}>
                            <h3 className={styles.stepTitle}>{labels.codeTitle}</h3>
                            <div className={styles.field}>
                                {/* Box count follows the API's `codeLength` — 8
                                    on the sign-in path pairing always takes. */}
                                <div className={styles.otpRow}>
                                    {code.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => { digitRefs.current[i] = el }}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            autoFocus={i === 0}
                                            maxLength={code.length}
                                            className={`${styles.otpBox} ${codeError ? styles.otpBoxError : ''}`}
                                            value={digit}
                                            onChange={e => handleDigitChange(i, e.target.value)}
                                            onKeyDown={e => handleDigitKeyDown(i, e)}
                                            onFocus={e => e.target.select()}
                                            aria-invalid={Boolean(codeError)}
                                            aria-label={`${labels.codeTitle} ${i + 1}`}
                                        />
                                    ))}
                                </div>
                                {codeError ? (
                                    <p className={styles.errorText}>{codeError}</p>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                className={styles.resend}
                                onClick={resendCode}
                                disabled={busy}
                            >
                                {labels.resendCode}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={!canSubmitCode || busy}
                        >
                            {labels.confirm}
                        </button>
                    </form>
                ) : null}

                {step === 'error' ? (
                    <div className={styles.statusContent}>
                        <div className={styles.status}>
                            <div className={styles.statusIconWrap}>
                                <span className={styles.statusCircle}>
                                    <Icon name="x-circle-red.svg" alt="" />
                                </span>
                            </div>
                            <p className={styles.note}>{fatalError}</p>
                        </div>
                        <button type="button" className={styles.btnPrimary} onClick={goToEmail}>
                            {labels.tryAgain}
                        </button>
                    </div>
                ) : null}

                {step === 'success' ? (
                    <div className={styles.statusContent}>
                        <div className={`${styles.status} ${styles.statusSuccess}`}>
                            <div className={styles.statusIconWrap}>
                                <Icon
                                    name="success-check.svg"
                                    className={styles.statusIcon}
                                    alt=""
                                />
                            </div>
                            <p className={styles.statusTitle}>{labels.successTitle}</p>
                        </div>
                        <button type="button" className={styles.btnSecondary} onClick={onClose}>
                            {labels.close}
                        </button>
                    </div>
                ) : null}
            </section>
        </div>
        {/* TEMPORARY, dev only — sibling of the backdrop so its clicks never
            reach onClose. Delete with DevStepPicker.tsx. */}
        <DevStepPicker onJump={devJump} />
        </>,
        document.body,
    )
}

export default PairWalletModal
