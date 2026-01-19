import styles from './styles.module.css'
import Modal from '../../Modal/Modal'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { ComponentProps, useState } from 'react'
import { useTranslation } from 'react-i18next'
import message from '../../../utils/message'
import { useGoogleAnalytics } from '../../../utils/hooks/useGoogleAnalytics'
import { useRouteLoaderData } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { isDesktop } from 'react-device-detect'
import { useWalletAddress } from '../../../utils/hooks/useWalletAddress'
import { ENV } from '../../../config'

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    backgroundColor: string | undefined,
    iconPath: string
    name: string
    cashback: string
    terms: string
    redirectLink: string
    iframeUrl?: string
    token?: string
    domain?: string
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
    domain
}: Props) => {

    const { sendGaEvent } = useGoogleAnalytics()
    const { extensionId, cryptoSymbols, iconsPath, showTerms, platform } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const [fallbackImg, setFallbackImg] = useState('')
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
        sendGaEvent('retailer_shop', {
            category: 'user_action',
            action: 'click',
            details: name,
        })
    }

    if (isDesktop && !showTerms) {
        return (
            <Modal
                showCloseBtn={!showingTerms}
                xMarkPath='x-mark-light.svg'
                style={{ '--custom-modal-bg': 'var(--retailer-custom-modal-bg,var(--modal-bg))' }}
                open={open}
                closeFn={onClose}
            >
                {showingTerms && (
                    <button
                        id="retailer-modal-back-btn"
                        className={styles.back_btn}
                        onClick={() => setShowingTerms(false)}
                    >
                        <img
                            src={`${iconsPath}/arrow-left-light.svg`}
                            onError={e => e.currentTarget.src = `${iconsPath}/arrow-left.svg`}
                            alt="arrow-left"
                        />
                        <span>{t('back')}</span>
                    </button>
                )}
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
                                style={{ width: '100%' }}
                            >
                                {terms ? (
                                    <Markdown 
                                        className={`${styles.markdown} ${styles.markdown_short}`}
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            a: ({ href, children, ...props }) => {
                                                if (href?.startsWith('#')) {
                                                    return <a href={href} {...props}>{children}</a>
                                                }
                                                if (href?.startsWith('http')) {
                                                    const url = new URL(href)
                                                    url.searchParams.set('platform', platform.toUpperCase())
                                                    url.searchParams.set('address', walletAddress || 'null')
                                                    url.searchParams.set('env', ENV)                                                    
                                                    return (
                                                        <a
                                                            {...props}
                                                            className={styles.externalLink}
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                window.open(url.toString(), '_blank', 'noopener,noreferrer')
                                                            }}
                                                        >
                                                            {children}
                                                        </a>
                                                    )
                                                }
                                                return <a href={href} {...props}>{children}</a>
                                            }
                                        }}
                                    >
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
                                className={styles.modal}
                                style={{ width: '100%' }}
                            >
                                <div
                                    className={styles.logo_container}
                                    style={{ backgroundColor: backgroundColor || 'white' }}
                                >
                                    {fallbackImg ?
                                        <div className={styles.fallback_img}>{fallbackImg}</div>
                                        :
                                        <img
                                            className={`${styles.logo} ${styles.logo_big}`}
                                            loading='eager'
                                            src={iconPath}
                                            alt={`${name} logo`}
                                            onError={() => setFallbackImg(name)}
                                        />
                                    }
                                </div>
                                <div className={styles.retailer_name}>Shop and earn up to {cashback} {cryptoSymbols[0]} cashback</div>
                                {redirectLink && terms ?
                                    <a
                                        id="retailer-modal-start-shopping-btn"
                                        className={styles.start_btn}
                                        onClick={activate}
                                        href={redirectLink}
                                        target='_blank'
                                    >
                                        {t('startShopping')}
                                    </a>
                                    :
                                    <button
                                        id="retailer-modal-loading-btn"
                                        className={styles.start_btn}
                                        disabled={true}
                                    >
                                        {t('loadingBtn')}
                                    </button>
                                }
                                <div className={styles.consent_txt}>
                                    By clicking Go Shopping, you accept the <button
                                        id="retailer-modal-terms-btn"
                                        className={styles.terms_btn}
                                        onClick={() => setShowingTerms(true)}
                                    >Terms and Exclusions</button>
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
            style={{ '--custom-modal-bg': 'var(--retailer-custom-modal-bg,var(--modal-bg))' }}
            open={open}
            closeFn={onClose}
        >
            <div className={styles.modal}>
                <div className={styles.full}>
                    <div
                        className={styles.logo_container}
                        style={{ backgroundColor: backgroundColor || 'white' }}
                    >
                        {fallbackImg ?
                            <div className={styles.fallback_img}>{fallbackImg}</div>
                            :
                            <img
                                className={styles.logo}
                                loading='eager'
                                src={iconPath}
                                alt={`${name} logo`}
                                onError={() => setFallbackImg(name)}
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
                    <Markdown 
                        className={styles.markdown}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            a: ({ href, children, ...props }) => {
                                if (href?.startsWith('#')) {
                                    return <a href={href} {...props}>{children}</a>
                                }
                                if (href?.startsWith('http')) {
                                    const url = new URL(href)
                                    url.searchParams.set('platform', platform.toUpperCase())
                                    url.searchParams.set('address', walletAddress || 'null')
                                    if (ENV !== 'prod') {
                                        url.searchParams.set('env', ENV)
                                    }
                                    return (
                                        <a
                                            {...props}
                                            className={styles.externalLink}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                window.open(url.toString(), '_blank', 'noopener,noreferrer')
                                            }}
                                        >
                                            {children}
                                        </a>
                                    )
                                }
                                return <a href={href} {...props}>{children}</a>
                            }
                        }}
                    >
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
                    By clicking Go Shopping, you accept the Terms and Exclusions above.
                </div>
            </div>
        </Modal>
    )
}

export default RetailerCardModal