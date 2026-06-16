/**
 * Category tabs row: horizontally scrollable pills + a fixed search button.
 * One category selected at a time (click active to clear). Shows a single
 * placeholder bar while loading.
 */
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon/Icon'
import { useDragScroll } from '../../../utils/hooks/useDragScroll'
import styles from './styles.module.css'

export interface MobileCategoriesItem {
    id: number
    name: string
}

interface Props {
    categories: MobileCategoriesItem[]
    selectedId?: number | null
    isLoading?: boolean
    onSelect: (cat: MobileCategoriesItem | null) => void
    onSearchClick?: () => void
}

const MobileCategories = ({
    categories,
    selectedId,
    isLoading,
    onSelect,
    onSearchClick,
}: Props) => {
    const { t } = useTranslation()
    const { ref: scrollerRef, didDrag } = useDragScroll<HTMLDivElement>(!isLoading)

    if (isLoading) {
        return (
            <div className={`${styles.root} ${styles.rootLoading}`} aria-label={t('categories') || 'Categories'}>
                <span className={styles.loadingBar} aria-hidden="true" />
            </div>
        )
    }

    return (
        <div className={styles.root} role="tablist" aria-label={t('categories') || 'Categories'}>
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
                aria-label={t('search') || 'Search'}
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

export default MobileCategories
