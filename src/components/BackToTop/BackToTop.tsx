/**
 * Floating scroll-to-top; shown once scrolled past one viewport height.
 * Pure UI — logic in useBackToTop.
 */
import styles from './styles.module.css'
import Icon from '../Icon/Icon'
import { useBackToTop } from './useBackToTop'

const BackToTop = () => {
    const { visible, scrollToTop, labels } = useBackToTop()

    if (!visible) return null

    return (
        <button
            id="back-to-top-btn"
            type="button"
            className={styles.button}
            aria-label={labels.backToTop}
            onClick={scrollToTop}
        >
            <Icon className={styles.icon} name="arrow-up.svg" alt="" />
        </button>
    )
}

export default BackToTop
