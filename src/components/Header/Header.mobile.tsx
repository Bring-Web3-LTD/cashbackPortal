import Icon from '../Icon/Icon'
import { HeaderProps } from './useHeader'
import styles from './styles.mobile.module.css'

const Header = ({ title, onBack, onClose }: HeaderProps) => (
    <header className={styles.header}>
        <div className={styles.side}>
            {onBack ? (
                <button type="button" className={styles.action} onClick={onBack} aria-label="Back">
                    <Icon name="arrow-left.svg" className={styles.actionIcon} />
                </button>
            ) : (
                <span className={styles.actionSpacer} aria-hidden="true" />
            )}
        </div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.side}>
            {onClose ? (
                <button type="button" className={styles.action} onClick={onClose} aria-label="Close">
                    <Icon name="x-mark.svg" className={styles.actionIcon} />
                </button>
            ) : (
                <span className={styles.actionSpacer} aria-hidden="true" />
            )}
        </div>
    </header>
)

export default Header
