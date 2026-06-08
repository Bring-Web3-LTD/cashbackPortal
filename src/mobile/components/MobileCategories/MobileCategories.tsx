/**
 * Category tabs row: horizontally scrollable pills + a fixed search button.
 * One category selected at a time (click active to clear). Shows a single
 * placeholder bar while loading.
 */
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../../components/Icon/Icon'
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
    const scrollerRef = useRef<HTMLDivElement>(null)

    // Map vertical wheel to horizontal scroll, but let the page scroll at the ends.
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const el = scrollerRef.current
        if (!el) return
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
        if (delta === 0) return
        const atStart = el.scrollLeft <= 0
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
        if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return
        e.preventDefault()
        el.scrollLeft += delta
    }

    if (isLoading) {
        return (
            <div className={`${styles.root} ${styles.rootLoading}`} aria-label={t('categories') || 'Categories'}>
                <span className={styles.loadingBar} aria-hidden="true" />
            </div>
        )
    }

    return (
        <div className={styles.root} role="tablist" aria-label={t('categories') || 'Categories'}>
            <div className={styles.scroller} ref={scrollerRef} onWheel={handleWheel}>
                {categories.map((cat) => {
                    const active = cat.id === selectedId
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                            onClick={() => onSelect(active ? null : cat)}
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
