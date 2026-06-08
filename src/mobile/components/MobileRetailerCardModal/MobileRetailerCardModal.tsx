/** Mobile T&C modal: retailer logo, cashback pill, terms, then Cancel + Go to shop (a target="_blank" anchor to the pre-fetched redirect URL so it opens a top-level tab). */
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouteLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Markdown from 'react-markdown'
import formatCashback from '../../../utils/formatCashback'
import { getInitials } from '../../../utils/getInitials'
import Icon from '../../../components/Icon/Icon'
import styles from './styles.module.css'

interface Props {
    open: boolean
    retailer: Retailer | null
    iconPath: string
    terms: string
    /** Pre-fetched retailer redirect URL. Empty until activate() resolves. */
    redirectLink: string
    onCancel: () => void
    onGoToShop: () => void
}

const MobileRetailerCardModal = ({
    open,
    retailer,
    iconPath,
    terms,
    redirectLink,
    onCancel,
    onGoToShop,
}: Props) => {
    const { cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const { t } = useTranslation()
    const [fallbackLogo, setFallbackLogo] = useState('')
    // Spinner state set only after tapping "Go to shop"; reset on retailer change.
    const [isNavigating, setIsNavigating] = useState(false)

    // Reset logo fallback whenever the retailer changes so a new icon attempts
    // a fresh load instead of inheriting the previous retailer's failure state.
    useEffect(() => {
        setFallbackLogo('')
        setIsNavigating(false)
    }, [retailer?.id])

    // Lock background page scroll while the modal is open so the only
    // scrollbar that ever appears is the (hidden) one inside the T&C box.
    // Some mobile browsers scroll <html>, others <body>, so lock both.
    useEffect(() => {
        if (!open) return
        const { documentElement: html, body } = document
        const prevHtml = html.style.overflow
        const prevBody = body.style.overflow
        const prevTouch = body.style.touchAction
        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'
        body.style.touchAction = 'none'
        return () => {
            html.style.overflow = prevHtml
            body.style.overflow = prevBody
            body.style.touchAction = prevTouch
        }
    }, [open])

    const cashback = useMemo(
        () =>
            retailer
                ? formatCashback(retailer.maxCashback, retailer.cashbackSymbol, retailer.cashbackCurrency)
                : '',
        [retailer],
    )

    const tokenSymbol = cryptoSymbols?.[0] ?? ''

    // Portal to <body> so ancestor `transform`s (framer-motion on the
    // MobileLayout root) don't make `position: fixed` resolve against the
    // 360px-wide layout container instead of the viewport — which would
    // push the action buttons below the visible area.
    return createPortal(
        <>
            {open && retailer ? (
                <div
                    className={styles.backdrop}
                    onClick={onCancel}
                >
                    <div
                        className={styles.panel}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="mobile-retailer-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className={styles.header}>
                            <span className={styles.header_spacer} aria-hidden="true" />
                            <h2 id="mobile-retailer-modal-title" className={styles.header_title}>
                                {t('cashbackDetails')}
                            </h2>
                            <button
                                type="button"
                                className={styles.header_close}
                                onClick={onCancel}
                                aria-label={t('close')}
                            >
                                <Icon name="x-mark.svg" alt="" />
                            </button>
                        </header>

                        <div className={styles.body}>
                            <div className={styles.text}>
                                <div className={styles.retailer}>
                                    <div
                                        className={styles.logo}
                                        style={
                                            !fallbackLogo
                                                ? { backgroundColor: retailer.backgroundColor || 'white' }
                                                : undefined
                                        }
                                    >
                                        {fallbackLogo ? (
                                            <span
                                                className={`${styles.fallback} ${
                                                    fallbackLogo.length === 2 ? styles.fallback_two : ''
                                                }`}
                                            >
                                                {fallbackLogo}
                                            </span>
                                        ) : (
                                            <img
                                                className={styles.logo_img}
                                                src={iconPath}
                                                alt={`${retailer.name} logo`}
                                                onError={() => setFallbackLogo(getInitials(retailer.name))}
                                            />
                                        )}
                                    </div>
                                    <span className={styles.name}>{retailer.name}</span>
                                    <span className={styles.cashback_pill}>
                                        <span className={styles.cashback_label}>{t('upTo')}</span>
                                        <span className={styles.cashback_amount}>
                                            {cashback} {t('in')} {tokenSymbol}
                                        </span>
                                    </span>
                                </div>

                                <section className={styles.terms_box}>
                                    <h3 className={styles.terms_title}>{t('cashbackTermsTitle')}</h3>
                                    <div className={styles.terms_body}>
                                        {terms ? (
                                            <Markdown>{terms}</Markdown>
                                        ) : (
                                            <span className={styles.terms_loading}>{t('loading')}</span>
                                        )}
                                    </div>
                                    <span className={styles.terms_fade} aria-hidden="true" />
                                </section>
                            </div>

                            <div className={styles.footer}>
                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        className={`${styles.cancel_btn} ${(isNavigating || !(redirectLink && terms)) ? styles.cancel_btn_processing : ''}`}
                                        onClick={onCancel}
                                    >
                                        {t('cancel')}
                                    </button>
                                    {redirectLink && terms ? (
                                        <a
                                            className={styles.shop_btn}
                                            href={redirectLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-busy={isNavigating}
                                            onClick={() => {
                                                setIsNavigating(true)
                                                onGoToShop()
                                            }}
                                        >
                                            {isNavigating ? (
                                                <span className={styles.spinner} aria-hidden="true" />
                                            ) : (
                                                t('goToShop')
                                            )}
                                        </a>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.shop_btn}
                                            disabled
                                        >
                                            <span className={styles.spinner} aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                                <p className={styles.disclaimer}>{t('agreeTerms')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>,
        document.body,
    )
}

export default MobileRetailerCardModal
