/** Mobile T&C modal: retailer logo, cashback pill, terms, then Cancel + Go to shop (a target="_blank" anchor to the pre-fetched redirect URL so it opens a top-level tab). */
/** Mobile T&C modal: retailer logo, cashback pill, terms, then Cancel + Go to
 * shop (a target="_blank" anchor to the pre-fetched redirect URL so it opens a
 * top-level tab). Pure UI — logic in useMobileRetailerCardModal. */
import { createPortal } from 'react-dom'
import Markdown from 'react-markdown'
import Icon from '../../../components/Icon/Icon'
import { useMobileRetailerCardModal, MobileRetailerCardModalProps } from '../../hooks/useMobileRetailerCardModal'
import styles from './styles.module.css'

const MobileRetailerCardModal = (props: MobileRetailerCardModalProps) => {
    const { open, retailer, iconPath, terms, redirectLink, onCancel } = props
    const {
        t,
        fallbackLogo,
        onLogoError,
        isNavigating,
        onGoToShopClick,
        cashback,
        tokenSymbol,
    } = useMobileRetailerCardModal(props)

    // Portal to <body> so ancestor `transform`s (framer-motion on the
    // MobileOutlet root) don't make `position: fixed` resolve against the
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
                                                alt={`${retailer.displayName} logo`}
                                                onError={onLogoError}
                                            />
                                        )}
                                    </div>
                                    <div className={styles.retailer_info}>
                                        <span className={styles.name}>{retailer.displayName}</span>
                                        <span className={styles.cashback_pill}>
                                            <span className={styles.cashback_label}>{t('upTo')}</span>
                                            <span className={styles.cashback_amount}>
                                                {cashback} {t('in')} {tokenSymbol}
                                            </span>
                                        </span>
                                    </div>
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
                                        disabled={isNavigating}
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
                                            onClick={onGoToShopClick}
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
