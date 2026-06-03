/**
 * Active-filter chip. Replaces the categories row when a category or search
 * suggestion is committed: a pill with the label and a clear (X) button.
 */
import Icon from '../../../components/Icon/Icon'
import styles from './styles.module.css'

interface Props {
    label: string
    onClear: () => void
    /** Optional clamp for very long labels. */
    maxWidth?: number
}

const MobileFilterChip = ({ label, onClear, maxWidth }: Props) => {
    const style = maxWidth ? { maxWidth: `${maxWidth}px` } : undefined

    return (
        <div className={styles.root}>
            <span className={styles.chip}>
                <span className={styles.label} style={style} title={label}>
                    {label}
                </span>
                <button
                    type="button"
                    className={styles.clear}
                    onClick={onClear}
                    aria-label="Clear filter"
                >
                    <Icon name="x-mark.svg" className={styles.clearIcon} />
                </button>
            </span>
        </div>
    )
}

export default MobileFilterChip
