import styles from './styles.module.css'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../Icon/Icon'

/** Floating scroll-to-top; shown once scrolled past one viewport height. */
const BackToTop = () => {
    const { t } = useTranslation()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > window.innerHeight)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    if (!visible) return null

    return (
        <button
            id="back-to-top-btn"
            type="button"
            className={styles.button}
            aria-label={t('backToTop', 'Back to top')}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
            <Icon className={styles.icon} name="arrow-up.svg" alt="" />
        </button>
    )
}

export default BackToTop
