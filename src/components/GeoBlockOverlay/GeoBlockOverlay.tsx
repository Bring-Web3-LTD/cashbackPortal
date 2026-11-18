import styles from './styles.module.css'
import { useGeoBlockOverlay } from './useGeoBlockOverlay'

interface Props {
    /** The mobile portal: smaller card and type. */
    mobile?: boolean
}

/**
 * Full-screen "not live in your area" overlay (TODO#802), shown when the token
 * says the platform is not live in the user's country. The page behind it is
 * made inert by the caller; there is no close button and no action by design.
 */
const GeoBlockOverlay = ({ mobile = false }: Props) => {
    const { title, body, dialogRef, privacy, bringTou, privacyLabel, termsLabel } = useGeoBlockOverlay()

    return (
        <div
            ref={dialogRef}
            tabIndex={-1}
            className={`${styles.overlay} ${mobile ? styles.mobile : ''}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="geo-block-title"
            aria-describedby="geo-block-body"
        >
            <div className={styles.content}>
            <div className={styles.card}>
                {/* Inline, the same on every platform and portal mode: the design's own color */}
                <svg className={styles.icon} viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <path d="M42 24C42 33.9411 33.9411 42 24 42C14.0589 42 6 33.9411 6 24C6 14.0589 14.0589 6 24 6C33.9411 6 42 14.0589 42 24Z" strokeWidth="3.2" stroke="#FFEF46" />
                    <path d="M6 24H42M24 6C29 11.2 31.6 17.2 31.6 24C31.6 30.8 29 36.8 24 42C19 36.8 16.4 30.8 16.4 24C16.4 17.2 19 11.2 24 6Z" strokeWidth="3.2" strokeLinejoin="round" stroke="#FFEF46" />
                </svg>
                <div className={styles.text}>
                    <h1 id="geo-block-title" className={styles.title}>{title}</h1>
                    <p id="geo-block-body" className={styles.body}>{body}</p>
                </div>
            </div>
            {(privacy || bringTou) ?
                <nav className={styles.legal}>
                    {privacy ? <a href={privacy} target="_blank" rel="noreferrer" className={styles.link}>{privacyLabel}</a> : null}
                    {bringTou ? <a href={bringTou} target="_blank" rel="noreferrer" className={styles.link}>{termsLabel}</a> : null}
                </nav>
                : null}
            </div>
        </div>
    )
}

export default GeoBlockOverlay
