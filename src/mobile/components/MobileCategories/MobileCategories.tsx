/**
 * Category tabs row: horizontally scrollable pills + a fixed search button.
 * One category selected at a time (click active to clear). Shows a single
 * placeholder bar while loading.
 */
import { useEffect, useRef } from 'react'
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
    const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false })

    useEffect(() => {
        const el = scrollerRef.current
        if (!el) return

        const onMouseDown = (e: MouseEvent) => {
            dragRef.current = { active: true, startX: e.clientX, startScrollLeft: el.scrollLeft, moved: false }
            el.style.cursor = 'grabbing'
            el.style.userSelect = 'none'
        }

        const onMouseMove = (e: MouseEvent) => {
            if (!dragRef.current.active) return
            const dx = e.clientX - dragRef.current.startX
            if (Math.abs(dx) > 3) dragRef.current.moved = true
            el.scrollLeft = dragRef.current.startScrollLeft - dx
        }

        const onMouseUp = () => {
            dragRef.current.active = false
            el.style.cursor = ''
            el.style.userSelect = ''
        }

        el.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        return () => {
            el.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [isLoading])

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
                            onClick={() => { if (!dragRef.current.moved) onSelect(active ? null : cat) }}
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
