/**
 * Logic hook for the Categories tabs row (the component view-model — NOT the
 * `/categories` data query, which lives in pages/Home/useCategories). Owns the
 * drag-scroll wiring and resolves the i18n labels so the view is pure UI.
 */
import { useTranslation } from 'react-i18next'
import { useDragScroll } from '../../hooks/useDragScroll'

export interface CategoriesItem {
    id: number
    name: string
}

export interface CategoriesProps {
    categories: CategoriesItem[]
    selectedId?: number | null
    isLoading?: boolean
    onSelect: (cat: CategoriesItem | null) => void
    onSearchClick?: () => void
}

export const useCategories = (isLoading?: boolean) => {
    const { t } = useTranslation()
    const { ref: scrollerRef, didDrag } = useDragScroll<HTMLDivElement>(!isLoading)

    return {
        scrollerRef,
        didDrag,
        labels: {
            categories: t('categories'),
            search: t('search'),
        },
    }
}
