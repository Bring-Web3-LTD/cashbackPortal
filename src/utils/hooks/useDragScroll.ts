/**
 * Pointer-drag horizontal scrolling for an overflow-x container.
 *
 * Attach the returned `ref` to the scroll container. Press-and-drag scrolls it;
 * `didDrag()` reports whether the last interaction moved past a small threshold
 * so a click handler can ignore the click that ends a drag.
 *
 * `enabled` re-wires the listeners when it flips (e.g. pass `!isLoading` when the
 * container is conditionally rendered, so listeners attach once the node mounts).
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

        const onMouseDown = (e: MouseEvent) => {
            drag.current = { active: true, startX: e.clientX, startScrollLeft: el.scrollLeft, moved: false }
            el.style.cursor = 'grabbing'
            el.style.userSelect = 'none'
        }

        const onMouseMove = (e: MouseEvent) => {
            if (!drag.current.active) return
            const dx = e.clientX - drag.current.startX
            if (Math.abs(dx) > DRAG_THRESHOLD) drag.current.moved = true
            el.scrollLeft = drag.current.startScrollLeft - dx
        }

        const onMouseUp = () => {
            drag.current.active = false
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
    }, [enabled])

    // True if the last press moved far enough to count as a drag.
    const didDrag = () => drag.current.moved

    return { ref, didDrag }
}
