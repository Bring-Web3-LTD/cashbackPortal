/**
 * Mobile portal top bar.
 *
 * Layout: [back action] — [centered title] — [settings action]
 *
 * Both actions are optional; defaults are:
 *   • left  = router back (navigates -1; hidden on root if `hideBack`)
 *   • right = settings cog (no-op until wired)
 *
 * All visual tokens come from the active stylesheet (DEFAULT mobile by
 * default, optionally overridden per platform via
 * /{PLATFORM}/mobile/stylesheets/{theme}.css).
 */
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon/Icon'
import styles from './styles.module.css'

interface Props {
    /** Centered title text. Falls back to i18n `title`. */
    title?: string
    /** Hide the left back button (e.g. on the root mobile page). */
    hideBack?: boolean
    /** Override the right-side action. Pass `null` to hide it. */
    rightAction?: ReactNode | null
    /** Override the left-side action. Pass `null` to hide it. */
    leftAction?: ReactNode | null
    /** Override the default back behaviour. */
    onBack?: () => void
    /** Click handler for the default settings cog. */
    onSettingsClick?: () => void
}

const MobileHeader = ({
    title,
    hideBack,
    leftAction,
    rightAction,
    onBack,
    onSettingsClick,
}: Props) => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const resolvedTitle = title ?? t('title')

    const handleBack = () => {
        if (onBack) onBack()
        else navigate(-1)
    }

    const defaultLeft = hideBack ? (
        <span className={styles.actionSpacer} aria-hidden="true" />
    ) : (
        <button
            type="button"
            className={styles.action}
            onClick={handleBack}
            aria-label={t('back') || 'Back'}
        >
            <Icon name="arrow-left.svg" className={styles.actionIcon} />
        </button>
    )

    const defaultRight = (
        <button
            type="button"
            className={styles.action}
            onClick={onSettingsClick}
            aria-label="Settings"
        >
            <Icon name="gear.svg" className={styles.actionIcon} />
        </button>
    )

    const left = leftAction === undefined ? defaultLeft : leftAction
    const right = rightAction === undefined ? defaultRight : rightAction

    return (
        <header className={styles.header}>
            <div className={styles.side}>{left ?? <span className={styles.actionSpacer} aria-hidden="true" />}</div>
            <h1 className={styles.title}>{resolvedTitle}</h1>
            <div className={styles.side}>{right ?? <span className={styles.actionSpacer} aria-hidden="true" />}</div>
        </header>
    )
}

export default MobileHeader
