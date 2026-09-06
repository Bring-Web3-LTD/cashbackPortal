import styles from './styles.module.css'
import Modal from '../Modal/Modal'
import { ComponentProps, FormEvent, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../Icon/Icon'
import { usePairWallet } from './usePairWallet'
import { useOtpInputs } from './useOtpInputs'

const shellOverrides = {
    '--custom-modal-bg': 'var(--modal-popup-frame-bg, var(--modal-bg))',
    '--custom-modal-radius': 'var(--modal-popup-radius, var(--modal-radius))',
}

type Props = Omit<ComponentProps<typeof Modal>, 'children'>

const PairWalletModal = ({ open, closeFn }: Props) => {
    const { t } = useTranslation()
    // Flow, validation and the API round-trips are shared with the mobile
    // sheet; only this view is desktop-specific.
    const {
        step, busy,
        email, setEmail, emailErrorKey, submitEmail, canSubmitEmail, continueWithGoogle,
        code, setCode, codeLength, codeErrorKey, clearCodeError, canSubmitCode,
        submitCode, resendCode,
    } = usePairWallet({ open })

    const { digitRefs, handleDigitChange, handleDigitKeyDown, focusFirst } = useOtpInputs({
        code,
        setCode,
        length: codeLength,
        onEdit: clearCodeError,
    })

    // The code arrives by mail, so the user comes back to this screen from
    // another window — put the caret where they need it.
    useEffect(() => {
        if (step === 'code') focusFirst()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])

    const submit = (e: FormEvent) => {
        e.preventDefault()
        if (step === 'code') submitCode()
        else submitEmail()
    }

    const isCode = step === 'code'

    return (
        <Modal
            open={open}
            closeFn={closeFn}
            className={styles.overlay}
            contentClassName={`${styles.shell} ${isCode ? styles.shell_code : styles.shell_email}`}
            closeBtnClassName={styles.close}
            style={shellOverrides}
        >
            <div className={styles.header} />
            <form className={`${styles.form} ${isCode ? styles.form_code : ''}`} onSubmit={submit}>
                {isCode ? (
                    <div className={styles.content_code}>
                        <div className={styles.code_title}>{t('enterCode')}</div>
                        <div className={styles.code_group}>
                            <div className={styles.otp_wrap}>
                            <div className={styles.otp}>
                                {Array.from({ length: codeLength }, (_, i) => (
                                    <input
                                        key={i}
                                        ref={el => { digitRefs.current[i] = el }}
                                        className={[
                                            styles.otp_box,
                                            code[i] ? styles.otp_box_filled : '',
                                            codeErrorKey ? styles.otp_box_error : '',
                                        ].filter(Boolean).join(' ')}
                                        // A number input would bring spinners and
                                        // let `e`/`+` through; the mode is what
                                        // raises the numeric soft keyboard.
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        // The whole code, not 1: the browser
                                        // truncates a paste to maxLength before
                                        // onChange sees it, and useOtpInputs
                                        // needs the full string to spread across
                                        // the boxes. The rendered value stays one
                                        // character because `code[i]` is.
                                        maxLength={codeLength}
                                        value={code[i] ?? ''}
                                        onChange={e => handleDigitChange(i, e.target.value)}
                                        onKeyDown={e => handleDigitKeyDown(i, e)}
                                    />
                                ))}
                            </div>
                                {codeErrorKey && <div className={styles.error}>{t(codeErrorKey)}</div>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.content}>
                        <div className={styles.title}>{t('pairWallet')}</div>
                        {/* Google's branding guidelines fix the fill, border,
                            radius and type, so this button is not themed. */}
                        <button
                            id="pair-wallet-google-btn"
                            type="button"
                            className={styles.google}
                            disabled={busy}
                            onClick={continueWithGoogle}
                        >
                            <Icon className={styles.google_logo} name="google.svg" alt="" />
                            <span className={styles.google_label}>{t('signInWithGoogle')}</span>
                        </button>
                        <div className={styles.divider}>
                            <span className={styles.divider_line} />
                            <span className={styles.divider_label}>{t('or')}</span>
                            <span className={styles.divider_line} />
                        </div>
                        <input
                            id="pair-wallet-email"
                            className={`${styles.input} ${emailErrorKey ? styles.input_error : ''}`}
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder={t('emailPlaceholder')}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                )}
                <div className={`${styles.footer} ${isCode ? styles.footer_code : ''}`}>
                    <button
                        id="pair-wallet-submit-btn"
                        type="submit"
                        className={styles.btn}
                        disabled={busy || (isCode ? !canSubmitCode : !canSubmitEmail)}
                    >
                        {t(isCode ? 'confirm' : 'pair')}
                    </button>
                    {isCode && (
                        <button
                            id="pair-wallet-resend-btn"
                            type="button"
                            className={styles.resend}
                            disabled={busy}
                            onClick={resendCode}
                        >
                            {t('resendCode')}
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    )
}

export default PairWalletModal
