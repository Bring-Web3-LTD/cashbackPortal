/**
 * Category tabs row: horizontally scrollable pills + a fixed search button.
 * One category selected at a time (click active to clear). Shows a single
 * placeholder bar while loading.
 */
import Icon from '../Icon/Icon'
import { useCategories, CategoriesProps } from './useCategories'
import styles from './styles.mobile.module.css'

const Categories = ({
    categories,
    selectedId,
    isLoading,
    onSelect,
    onSearchClick,
}: CategoriesProps) => {
    const { scrollerRef, didDrag, labels } = useCategories(isLoading)

    if (isLoading) {
        return (
            <div className={`${styles.root} ${styles.rootLoading}`} aria-label={labels.categories}>
                <span className={styles.loadingBar} aria-hidden="true" />
            </div>
        )
    }

    return (
        <div className={styles.root} role="tablist" aria-label={labels.categories}>
            <div className={styles.scroller} ref={scrollerRef}>
                {categories.map((cat) => {
                    const active = cat.id === selectedId
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                            onClick={() => { if (!didDrag()) onSelect(active ? null : cat) }}
                        >
                            {cat.name}
                        </button>
                    )
                })}
            </div>

            <span className={styles.fog} aria-hidden="true" />

            <button
                type="button"
                className={styles.searchBtn}
                onClick={onSearchClick}
                aria-label={labels.search}
            >
                <Icon
                    name="magnifying-glass.svg"
                    className={`${styles.searchBtnIcon} ${styles.searchBtnIconDefault}`}
                />
                <Icon
                    name="magnifying-glass-active.svg"
                    className={`${styles.searchBtnIcon} ${styles.searchBtnIconActive}`}
                />
            </button>
        </div>
    )
}

export default Categories
