import styles from './styles.module.css'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useRouteLoaderData } from 'react-router-dom'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { ENV } from '../../config'
import Icon from '../Icon/Icon'
import ExplainModal from '../Modals/ExplainModal/ExplainModal'

interface Action {
    key: string
    label: string
    to?: string
    external?: boolean
    onClick?: () => void
}

const Header = () => {
    const { t } = useTranslation()
    const { platform, isHub } = useRouteLoaderData('root') as LoaderData
    const { walletAddress } = useWalletAddress()
    const [menuOpen, setMenuOpen] = useState(false)
    const [explainOpen, setExplainOpen] = useState(false)
    const helpRef = useRef<HTMLDivElement>(null)
    const supportUrl = `https://support.bring.network/?platform=${platform}&address=${walletAddress}&env=${ENV}`

    useEffect(() => {
        if (!menuOpen) return
        const onPointerDown = (e: PointerEvent) => {
            if (!helpRef.current?.contains(e.target as Node)) setMenuOpen(false)
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [menuOpen])

    const whatsThis: Action = { key: 'whats-this', label: t('whatsThis'), onClick: () => setExplainOpen(true) }
    const needHelp: Action = { key: 'need-help', label: t('needHelp'), to: '/faq' }
    const missingReward: Action = { key: 'missing-reward', label: t('frequentlyAskedQuestion'), to: supportUrl, external: true }

    // The bar and the overflow menu carry the same actions in different orders.
    const barActions = [needHelp, missingReward, whatsThis]
    const menuActions = [whatsThis, needHelp, missingReward]

    const renderAction = (action: Action, className: string, suffix: string) => {
        const close = () => setMenuOpen(false)

        return action.to ? (
            <Link
                key={action.key}
                id={`header-${action.key}-${suffix}`}
                to={action.to}
                className={className}
                onClick={close}
                {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
                {action.label}
            </Link>
        ) : (
            <button
                key={action.key}
                id={`header-${action.key}-${suffix}`}
                className={className}
                onClick={() => { action.onClick?.(); close() }}
            >
                {action.label}
            </button>
        )
    }

    const title = <h1 className={styles.title}>{t('title')}</h1>

    return (
        <header className={`${styles.header} ${isHub ? styles.hub : styles.in_app}`}>
            {isHub ? (
                <div className={styles.brand}>
                    {/* Platforms ship a raster mark; DEFAULT carries the generic SVG. */}
                    <Icon
                        className={styles.wallet_logo}
                        name="wallet-logo.png"
                        fallbackName="wallet-logo.svg"
                        alt=""
                    />
                    {title}
                </div>
            ) : title}
            <div className={styles.help} ref={helpRef}>
                <div className={styles.actions}>
                    {barActions.map(action => renderAction(action, styles.btn, 'link'))}
                </div>
                <button
                    id="header-more-btn"
                    className={styles.more}
                    aria-label={t('moreActions')}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(open => !open)}
                >
                    <span className={styles.dots} />
                </button>
                {menuOpen && (
                    <div className={styles.menu} role="menu">
                        {menuActions.map(action => renderAction(action, styles.menu_row, 'row'))}
                    </div>
                )}
            </div>
            <ExplainModal open={explainOpen} closeFn={() => setExplainOpen(false)} />
        </header>
    )
}

export default Header
