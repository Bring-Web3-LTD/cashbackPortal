/**
 * Logic hook for the desktop categories row. Owns the scroll container, the
 * measured overflow that drives the arrows, the swipe handlers and the
 * placeholder count — so the view is pure UI.
 *
 * Named for the surface because `useCategories` is the mobile row's hook; that
 * one drives a Swiper, this one a plain scroll container with arrows.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSwipeable } from 'react-swipeable'
import { useSkeletonPreview } from '../../hooks/useSkeletonPreview'
import useWindowSize from '../../hooks/useWindowSize'

/* Placeholder chips are evenly sized, so their count has to come from the
   width or they stretch: the design draws them ~127 wide at every size. The
   page gutter is 48 / 32 / 20 and the body caps at 1344. */
const SKELETON_CHIP = 127
const SKELETON_GAP = 8

const skeletonChipCount = (viewWidth: number) => {
    const gutter = viewWidth >= 1112 ? 48 : viewWidth >= 840 ? 32 : 20
    const available = Math.min(viewWidth, 1440) - gutter * 2
    const fits = Math.floor((available + SKELETON_GAP) / (SKELETON_CHIP + SKELETON_GAP))
    return Math.max(3, Math.min(10, fits))
}

export const useCategoriesDesktop = (categories: Category[]) => {
    const { t } = useTranslation()
    const skeletonPreview = useSkeletonPreview()
    const scrollRef = useRef<HTMLDivElement>(null)
    const [overflow, setOverflow] = useState({ left: false, right: false })
    const view = useWindowSize()

    // Affordances follow measured overflow, not a category count.
    const measure = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        setOverflow({
            left: el.scrollLeft > 1,
            right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
        })
    }, [])

    // skeletonPreview is a dependency because the skeleton branch renders no
    // scrollRef: leaving it out means the row that replaces the placeholders is
    // never measured, so the arrows stay hidden until the first manual scroll.
    useEffect(() => {
        measure()
    }, [measure, categories, view.width, skeletonPreview])

    const scrollBy = (left: number) => scrollRef.current?.scrollBy({ left, behavior: 'smooth' })
    const scrollLeft = () => scrollBy(-500)
    const scrollRight = () => scrollBy(500)

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => scrollRight(),
        onSwipedRight: () => scrollLeft(),
    })

    return {
        showSkeleton: !categories.length || skeletonPreview,
        skeletonCount: skeletonChipCount(view.width),
        scrollRef,
        overflow,
        measure,
        scrollLeft,
        scrollRight,
        swipeHandlers,
        labels: {
            scrollLeft: t('scrollCategoriesLeft', 'Scroll categories left'),
            scrollRight: t('scrollCategoriesRight', 'Scroll categories right'),
        },
    }
}
