import styles from './styles.module.css'
import Modal from '../../Modal/Modal'
import Markdown from 'react-markdown'
import { ComponentProps, useState } from 'react'
import { useTranslation } from 'react-i18next'
import message from '../../../utils/message'
import { useAnalytics } from '../../../hooks/useAnalytics'
import { useRouteLoaderData } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { isDesktop } from 'react-device-detect'
import Icon from '../../Icon/Icon'
import { getInitials } from '../../../utils/getInitials'

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    backgroundColor?: string | undefined,
    iconPath: string
    name: string
    cashback: string
    terms: string
    redirectLink: string
    iframeUrl?: string
    token?: string
    domain?: string
    fallbackLogo?: string
}

// The terms view can sit on its own surface, separate from the rest of the
// modal. Both fall back to the shell the modal already uses, so platforms that
// set neither are unchanged.
const termsShellOverrides = {
    '--custom-modal-bg': 'var(--modal-terms-bg, var(--retailer-custom-modal-bg, var(--modal-bg)))',
    '--custom-modal-radius': 'var(--modal-terms-radius, var(--retailer-custom-modal-radius, var(--modal-radius)))',
}

const RetailerCardModal = ({
    open,
    closeFn,
    backgroundColor,
    iconPath,
    name,
    cashback,
    terms,
    redirectLink,
    iframeUrl,
    token,
    domain,
    fallbackLogo: fallbackLogoProp
}: Props) => {

    const { sendAnalyticsEvent } = useAnalytics()
    const { extensionId, cryptoSymbols, showTerms } = useRouteLoaderData('root') as LoaderData
    const [fallbackLogo, setFallbackLogo] = useState(fallbackLogoProp || '')
    const [showingTerms, setShowingTerms] = useState(false)
    const { t } = useTranslation()

    const onClose = () => {
        setShowingTerms(false)
        message({ action: 'POPUP_CLOSED' })
        closeFn()
    }

    const activate = () => {
        window.postMessage({
            from: 'bringweb3',
            action: 'PORTAL_ACTIVATE',
            extensionId,
            time: 30 * 60 * 1000, // 30 minutes
            domain,
            iframeUrl,
            token
        })
        onClose()
        sendAnalyticsEvent('retailer_shop', {
            category: 'user_action',
            action: 'click',
            details: name,
        })
    }

    if (isDesktop && !showTerms) {
        return (
            <Modal
                showCloseBtn={!showingTerms}
                className={`${styles.retailer_overlay} ${styles.retailer_overlay_desktop}`}
                contentClassName={showingTerms ? styles.shell_terms : styles.shell}
                closeBtnClassName={styles.close}
                style={showingTerms ? termsShellOverrides : undefined}
                open={open}
                closeFn={onClose}
            >
                {showingTerms && (
                    <button
                        id="retailer-modal-back-btn"
                        className={styles.back_btn}
                        onClick={() => setShowingTerms(false)}
                    >
                    <div 
                        id="back_icon_container"
                        className={styles.back_icon_container}
                    >
                        <Icon
                            name="arrow-left.svg"
                            alt="arrow-left"
                        />
                    </div>
                    <div
                        id="back_txt_container"
                        className={styles.back_txt_container}
                    >
                        <span>{t('back')}</span>
                    </div>
                    </button>
                )}
                {!showingTerms && <div className={styles.header} />}
                <div className={styles.modal_container}>
                    <AnimatePresence mode="wait">
                        {showingTerms ? (
                            <motion.div
                                key="terms"
                                initial={{ x: 0, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: '100%', opacity: 0 }}
                                transition={{
                                    type: "tween",
                                    duration: 0.2,
                                    ease: "easeInOut"
                                }}
                                className={styles.modal}
                            >
                                {terms ? (
                                    <Markdown className={`${styles.markdown} ${styles.markdown_short}`}>
                                        {terms}
                                    </Markdown>
                                ) : (
                                    <div className={`${styles.markdown} ${styles.center}`}>
                                        Loading...
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="main"
                                initial={{ x: 0, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: '-100%', opacity: 0 }}
                                transition={{
                                    type: "tween",
                                    duration: 0.2,
                                    ease: "easeInOut"
                                }}
                                className={styles.go_shop}
                            >
                                <div className={styles.content}>
                                    {/* Empty slot in the design; absorbs the slack above the body. */}
                                    <div className={styles.spacer} />
                                    <div className={styles.body}>
                                        <div className={styles.text_section}>
                                            <div className={styles.provider}>
                                                <div className={styles.avatar}>
                                                    <div
                                                        className={styles.avatar_image}
                                                        style={{ backgroundColor: backgroundColor || 'white' }}
                                                    >
                                                        {fallbackLogo ?
                                                            <div className={styles.avatar_fallback}>{fallbackLogo}</div>
                                                            :
                                                            <img
                                                                className={styles.avatar_logo}
                                                                loading='eager'
                                                                src={iconPath}
                                                                alt={`${name} logo`}
                                                                onError={() => setFallbackLogo(getInitials(name))}
                                                            />
                                                        }
                                                    </div>
                                                </div>
                                                <div className={styles.wrapper}>
                                                    <div className={styles.title_row}>
                                                        <div className={styles.title}>
                                                            {t('shopAndEarn', { cashback, symbol: cryptoSymbols[0] })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.footer}>
                                    {redirectLink && terms ?
                                        <a
                                            id="retailer-modal-start-shopping-btn"
                                            className={styles.start_btn}
                                            onClick={activate}
                                            href={redirectLink}
                                            target='_blank'
                                            rel="noopener noreferrer"
                                        >
                                            {t('startShopping')}
                                        </a>
                                        :
                                        <button
                                            id="retailer-modal-loading-btn"
                                            className={`${styles.start_btn} ${styles.loading_btn}`}
                                            disabled={true}
                                            aria-label={t('loadingBtn')}
                                        >
                                            <span className={styles.loader} />
                                        </button>
                                    }
                                    <div className={styles.terms}>
                                        <span className={styles.terms_text}>
                                            {t('termsConsent')}{' '}
                                            <button
                                                id="retailer-modal-terms-btn"
                                                className={styles.terms_btn}
                                                onClick={() => setShowingTerms(true)}
                                            >{t('termsAndExclusions')}</button>
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Modal>
        )
    }

    return (
        <Modal
            className={styles.retailer_overlay}
            open={open}
            closeFn={onClose}
        >
            <div className={styles.modal}>
                <div className={styles.full}>
                    <div
                        className={styles.logo_container}
                        style={{ backgroundColor: backgroundColor || 'white' }}
                    >
                        {fallbackLogo ?
                            <div className={styles.fallback_logo}>{fallbackLogo}</div>
                            :
                            <img
                                className={styles.logo}
                                loading='eager'
                                src={iconPath}
                                alt={`${name} logo`}
                                onError={() => setFallbackLogo(getInitials(name))}
                            />
                        }
                    </div>
                    <div className={styles.details}>
                        <div className={styles.retailer_name}>Shop at {name}</div>
                        <div className={styles.cashback_rate}>
                            Up to {cashback} cashback
                        </div>
                    </div>
                </div>
                {terms ?
                    <Markdown className={styles.markdown}>
                        {terms}
                    </Markdown>
                    :
                    <div className={`${styles.markdown} ${styles.center}`}>
                        Loading...
                    </div>
                }
                {redirectLink && terms ?
                    <a
                        id="retailer-modal-start-shopping-mobile-btn"
                        className={styles.start_btn}
                        onClick={activate}
                        href={redirectLink}
                        target='_blank'
                    >
                        {t('startShopping')}
                    </a>
                    :
                    <button
                        id="retailer-modal-loading-mobile-btn"
                        className={styles.start_btn}
                        disabled={true}
                    >
                        {t('loadingBtn')}
                    </button>
                }
                <div className={styles.consent_txt}>
                    By clicking Go Shopping, you accept the {t('termsAndExclusions')} above.
                </div>
            </div>
        </Modal>
    )
}

export default RetailerCardModal