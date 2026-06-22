/**
 * Active-filter chip. Replaces the categories row when a category or search
 * suggestion is committed: a pill with the label and a clear (X) button.
 */
import Icon from '../Icon/Icon'
import { useFilterChip, FilterChipProps } from './useFilterChip'
import styles from './styles.mobile.module.css'

const FilterChip = ({ label, onClear }: FilterChipProps) => {
    const { labels } = useFilterChip()

    return (
        <div className={styles.root}>
            <span className={styles.chip}>
                <span className={styles.label} title={label}>
                    {label}
                </span>
                <button
                    type="button"
                    className={styles.clear}
                    onClick={onClear}
                    aria-label={labels.close}
                >
                    <Icon name="x-mark.svg" className={styles.clearIcon} />
                </button>
            </span>
        </div>
    )
}

export default FilterChip
