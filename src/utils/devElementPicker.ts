/**
 * Dev-only element picker for the Cashback Portal.
 *
 * The portal renders inside a cross-origin iframe in the dev-wrapper, so the
 * wrapper's visual-diff overlay can't reach into this document to inspect
 * elements. This module is the portal-side half: when the wrapper turns on
 * "pick mode" (via postMessage), it highlights the element under the cursor
 * here, and clicking LOCKS an element (a persistent box that survives exiting
 * pick mode). It reports geometry + the locked count back to the wrapper.
 *
 * It is mounted only when `DEV_MODE` is true (see main.tsx), and the whole
 * module is dynamically imported so it never ships in a production bundle.
 *
 * Protocol (tag `bringweb3-devpick`, kept separate from the portal session
 * protocol so the two never collide):
 *   ← from wrapper: { to: 'bringweb3-devpick', action: 'SET_PICK', enabled }
 *                   { to: 'bringweb3-devpick', action: 'CLEAR_LOCKS' }
 *   → to wrapper:   { from: 'bringweb3-devpick', action: 'HOVER' | 'PICK',
 *                     rect, tag, id }
 *                   { from: 'bringweb3-devpick', action: 'LOCKS', count }
 * `rect` is in this document's viewport coordinates; the wrapper offsets it by
 * the iframe's position to get page coordinates.
 */

const TAG = 'bringweb3-devpick'
const HOVER_COLOR = '#00E5FF'
const LOCK_COLOR = '#FF2D9B'

export const mountDevElementPicker = () => {
    let enabled = false

    const mkBox = (color: string, alpha: string): HTMLDivElement => {
        const b = document.createElement('div')
        Object.assign(b.style, {
            position: 'fixed',
            zIndex: '2147483647',
            pointerEvents: 'none',
            border: `1px solid ${color}`,
            background: alpha,
            boxSizing: 'border-box',
            display: 'none',
        } as Partial<CSSStyleDeclaration> as CSSStyleDeclaration)
        document.body.appendChild(b)
        return b
    }
    const mkLabel = (color: string): HTMLDivElement => {
        const l = document.createElement('div')
        Object.assign(l.style, {
            position: 'fixed',
            zIndex: '2147483647',
            pointerEvents: 'none',
            background: color,
            color: '#04222a',
            font: '10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
            padding: '1px 4px',
            borderRadius: '3px',
            whiteSpace: 'nowrap',
            display: 'none',
        } as Partial<CSSStyleDeclaration> as CSSStyleDeclaration)
        document.body.appendChild(l)
        return l
    }

    const hoverBox = mkBox(HOVER_COLOR, 'rgba(0,229,255,0.12)')
    const hoverLabel = mkLabel(HOVER_COLOR)
    // Locked elements each keep a persistent box + label.
    const locked = new Map<Element, { box: HTMLDivElement; label: HTMLDivElement }>()

    const describe = (el: Element): string => {
        const r = el.getBoundingClientRect()
        const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : ''
        return `${el.tagName.toLowerCase()}${id} · ${Math.round(r.width)}×${Math.round(r.height)}`
    }
    const place = (box: HTMLDivElement, label: HTMLDivElement, el: Element) => {
        const r = el.getBoundingClientRect()
        Object.assign(box.style, {
            display: '', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
        })
        label.textContent = describe(el)
        label.style.display = ''
        label.style.left = `${r.left}px`
        label.style.top = r.top - 16 < 0 ? `${r.top + 2}px` : `${r.top - 16}px`
    }

    const post = (action: string, extra: Record<string, unknown> = {}) => {
        window.parent.postMessage({ from: TAG, action, ...extra }, '*')
    }
    const postHover = (action: 'HOVER' | 'PICK', el: Element) => {
        const r = el.getBoundingClientRect()
        post(action, {
            rect: { x: r.left, y: r.top, width: r.width, height: r.height },
            tag: el.tagName.toLowerCase(),
            id: (el as HTMLElement).id || '',
        })
    }
    const postLocks = () => post('LOCKS', { count: locked.size })

    // Keep locked boxes pinned to their elements as the portal scrolls/resizes.
    let reposAttached = false
    const reposition = () => {
        for (const [el, rec] of locked) {
            if (!el.isConnected) { rec.box.remove(); rec.label.remove(); locked.delete(el); continue }
            place(rec.box, rec.label, el)
        }
        if (locked.size === 0) detachReposition()
    }
    const attachReposition = () => {
        if (reposAttached) return
        reposAttached = true
        window.addEventListener('scroll', reposition, true)
        window.addEventListener('resize', reposition)
    }
    function detachReposition() {
        if (!reposAttached) return
        reposAttached = false
        window.removeEventListener('scroll', reposition, true)
        window.removeEventListener('resize', reposition)
    }

    const toggleLock = (el: Element) => {
        const existing = locked.get(el)
        if (existing) {
            existing.box.remove(); existing.label.remove(); locked.delete(el)
            if (locked.size === 0) detachReposition()
        } else {
            const box = mkBox(LOCK_COLOR, 'rgba(255,45,155,0.12)')
            const label = mkLabel(LOCK_COLOR)
            place(box, label, el)
            locked.set(el, { box, label })
            attachReposition()
        }
        postLocks()
    }
    const clearLocks = () => {
        for (const { box, label } of locked.values()) { box.remove(); label.remove() }
        locked.clear()
        detachReposition()
        postLocks()
    }

    const onMove = (e: PointerEvent) => {
        const el = e.target as Element | null
        if (!el || el === hoverBox || el === hoverLabel) return
        place(hoverBox, hoverLabel, el)
        postHover('HOVER', el)
    }
    // Swallow the click so locking an element never triggers the portal's own
    // UI (navigation, buttons, …).
    const onClick = (e: MouseEvent) => {
        const el = e.target as Element | null
        if (!el) return
        e.preventDefault()
        e.stopPropagation()
        toggleLock(el)
        postHover('PICK', el)
    }

    const setEnabled = (on: boolean) => {
        if (on === enabled) return
        enabled = on
        if (on) {
            document.addEventListener('pointermove', onMove, true)
            document.addEventListener('click', onClick, true)
            document.body.style.cursor = 'crosshair'
        } else {
            document.removeEventListener('pointermove', onMove, true)
            document.removeEventListener('click', onClick, true)
            document.body.style.cursor = ''
            hoverBox.style.display = 'none'
            hoverLabel.style.display = 'none'
        }
    }

    window.addEventListener('message', (e: MessageEvent) => {
        const d = e.data as { to?: string; action?: string; enabled?: boolean } | null
        if (!d || d.to !== TAG) return
        if (d.action === 'SET_PICK') setEnabled(!!d.enabled)
        else if (d.action === 'CLEAR_LOCKS') clearLocks()
    })
}
