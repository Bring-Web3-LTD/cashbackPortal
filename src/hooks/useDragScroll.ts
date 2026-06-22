/**
 * Pointer-drag horizontal scrolling for an overflow-x container.
 *
 * Attach the returned `ref` to the scroll container. Press-and-drag scrolls it;
 * `didDrag()` reports whether the last interaction moved past a small threshold
 * so a click handler can ignore the click that ends a drag.
 *
 * `enabled` re-wires the listeners when it flips (e.g. pass `!isLoading` when the
 * container is conditionally rendered, so listeners attach once the node mounts).
 *
 * Used by `useCategories` (components/Categories) for the horizontally
 * scrollable tabs row.
 *
 * Handles both input types: mouse press-drag scrolls the container manually
 * (desktop / narrow window); on touch the container's native overflow-scroll
 * does the scrolling and we only track movement so `didDrag()` still suppresses
 * the tap that ends a swipe.
 */
import { useEffect, useRef } from 'react'

// Pixels of movement before a press is treated as a drag (vs a click).
const DRAG_THRESHOLD = 3

export function useDragScroll<T extends HTMLElement>(enabled = true) {
    const ref = useRef<T>(null)
    const drag = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false })

    useEffect(() => {
        const el = ref.current
        if (!el || !enabled) return

        // Shared gesture core, fed by both mouse and touch handlers.
        // `manualScroll` is true for mouse (we move scrollLeft ourselves) and
        // false for touch (native overflow-scroll already does it).
        const start = (clientX: number) => {
            drag.current = { active: true, startX: clientX, startScrollLeft: el.scrollLeft, moved: false }
        }
        const moveBy = (clientX: number, manualScroll: boolean) => {
            if (!drag.current.active) return
            const dx = clientX - drag.current.startX
            if (Math.abs(dx) > DRAG_THRESHOLD) drag.current.moved = true
            if (manualScroll) el.scrollLeft = drag.current.startScrollLeft - dx
        }
        const stop = () => {
            // Skip non-drag releases (e.g. a plain button click elsewhere).
            if (!drag.current.active) return
            drag.current.active = false
            el.style.cursor = ''
            el.style.userSelect = ''
        }

        const onMouseDown = (e: MouseEvent) => {
            start(e.clientX)
            el.style.cursor = 'grabbing'
            el.style.userSelect = 'none'
        }
        const onMouseMove = (e: MouseEvent) => moveBy(e.clientX, true)

        const onTouchStart = (e: TouchEvent) => start(e.touches[0].clientX)
        const onTouchMove = (e: TouchEvent) => moveBy(e.touches[0].clientX, false)

        el.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', stop)
        el.addEventListener('touchstart', onTouchStart)
        window.addEventListener('touchmove', onTouchMove)
        window.addEventListener('touchend', stop)
        window.addEventListener('touchcancel', stop)
        // Resets the drag state if the browser window loses focus (e.g. user
        // Alt-Tabs or opens a system menu mid-drag).
        window.addEventListener('blur', stop)
        // Resets the drag state if the cursor leaves the viewport and the mouse
        // is released outside the page.
        document.documentElement.addEventListener('mouseleave', stop)
        return () => {
            el.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', stop)
            el.removeEventListener('touchstart', onTouchStart)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', stop)
            window.removeEventListener('touchcancel', stop)
            window.removeEventListener('blur', stop)
            document.documentElement.removeEventListener('mouseleave', stop)
            // Reset styles on cleanup just in case unmount happens mid-drag.
            if (el) {
                el.style.cursor = ''
                el.style.userSelect = ''
            }
        }
    }, [enabled])

    // True if the last press moved far enough to count as a drag.
    const didDrag = () => drag.current.moved

    return { ref, didDrag }
}
