/**
 * Desktop header: title (with the wallet mark in the hub) and the help
 * actions, which collapse into an overflow menu when the bar narrows.
 * Pure UI — logic in useHeaderDesktop.
 */
import styles from './styles.module.css'
import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon'
import ExplainModal from '../Modals/ExplainModal/ExplainModal'
import { useHeaderDesktop, type Action } from './useHeaderDesktop'

const Header = () => {
    const {
        isHub,
        scrolled,
        helpRef,
        menuOpen,
        toggleMenu,
        closeMenu,
        explainOpen,
        closeExplain,
        barActions,
        menuActions,
        labels,
    } = useHeaderDesktop()

    const renderAction = (action: Action, className: string, suffix: string) => (
        action.to ? (
            <Link
                key={action.key}
                id={`header-${action.key}-${suffix}`}
                to={action.to}
                className={className}
                onClick={closeMenu}
                {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
                {action.label}
            </Link>
        ) : (
            <button
                key={action.key}
                id={`header-${action.key}-${suffix}`}
                className={className}
                onClick={() => { action.onClick?.(); closeMenu() }}
            >
                {action.label}
            </button>
        )
    )

    const title = <h1 className={styles.title}>{labels.title}</h1>

    return (
        <header className={[
            styles.header,
            isHub ? styles.hub : styles.in_app,
            scrolled ? styles.scrolled : '',
        ].filter(Boolean).join(' ')}>
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
                    aria-label={labels.moreActions}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={toggleMenu}
                >
                    <span className={styles.dots} />
                </button>
                {menuOpen && (
                    <div className={styles.menu} role="menu">
                        {menuActions.map(action => renderAction(action, styles.menu_row, 'row'))}
                    </div>
                )}
            </div>
            <ExplainModal open={explainOpen} closeFn={closeExplain} />
        </header>
    )
}

export default Header
