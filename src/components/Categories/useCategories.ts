/**
 * Logic hook for the Categories tabs row (the component view-model — NOT the
 * `/categories` data query, which lives in pages/Home/useCategories). Owns the
 * i18n labels, the selected-tab logic, and the Swiper config so the view is
 * pure UI.
 */
import { useTranslation } from 'react-i18next'
import { FreeMode, Mousewheel } from 'swiper/modules'
import type { SwiperProps } from 'swiper/react'

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

export const useCategories = ({ selectedId, onSelect }: CategoriesProps) => {
    const { t } = useTranslation()

    const isActive = (cat: CategoriesItem) => cat.id === selectedId
    // Click an active pill to clear the filter; otherwise select it.
    const selectTab = (cat: CategoriesItem) => onSelect(isActive(cat) ? null : cat)

    // Free drag scrolling (touch + mouse), wheel support.
    // `focusableElements` drops "button" so a mouse-drag can start on a pill;
    // mousewheel maps vertical wheel onto the row and releases at the edges.
    const swiperProps: SwiperProps = {
        modules: [FreeMode, Mousewheel],
        freeMode: { enabled: true, momentum: true, momentumBounce: false },
        slidesPerView: 'auto',
        spaceBetween: 0,
        grabCursor: true,
        simulateTouch: true,
        mousewheel: { forceToAxis: false, releaseOnEdges: true },
        focusableElements: 'input, select, option, textarea, video, label',
    }

    return {
        labels: {
            categories: t('categories'),
            search: t('search'),
        },
        isActive,
        selectTab,
        swiperProps,
    }
}
