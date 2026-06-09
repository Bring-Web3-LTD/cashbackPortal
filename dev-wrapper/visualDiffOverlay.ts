/**
 * Dev-only visual-diff overlay for the dev-wrapper.
 *
 * Drop a Figma PNG export over the running wrapper page to pixel-compare
 * layouts. The overlay is always mounted; `VITE_VISUAL_DIFF` controls whether
 * the panel starts expanded or collapsed. The loaded image, position, and
 * settings are persisted to localStorage so reloads keep them.
 *
 * Controls:
 *   - File picker, URL field, or drag & drop to load an image (drop a PNG
 *     from disk, or drag an image straight out of Figma / another tab)
 *   - X / Y / scale / opacity inputs
 *   - Drag the overlay image to position it (arrow keys nudge 1px,
 *     shift+arrows 10px)
 *   - `diff` toggles `mix-blend-mode: difference` (matching pixels go black)
 *   - `invert` toggles `filter: invert(1)` (flip the overlay's colors)
 *   - `grid` toggles a full-page pixel ruler grid (adjustable cell size/color)
 *   - `+ vert` / `+ horz` drop draggable guide lines (double-click one to
 *     remove it, `clear` removes all); each shows a live px readout
 *   - `hide` / `lock` / `reset`
 *
 * Note: this overlays the dev-wrapper page itself, NOT the portal rendered
 * inside the iframe (the portal is served from a separate origin in the
 * iframe, so it can't be overlaid from here).
 */

// A draggable ruler guide. `axis: 'x'` is a vertical line movable horizontally
// (pos = its left/x coordinate); `axis: 'y'` is a horizontal line movable
// vertically (pos = its top/y coordinate). Coordinates are viewport CSS px.
type Guide = { id: string; axis: 'x' | 'y'; pos: number }

type State = {
    src: string
    x: number
    y: number
    scale: number
    opacity: number
    diff: boolean
    invert: boolean
    visible: boolean
    locked: boolean
    collapsed: boolean
    border: boolean
    grid: boolean
    gridSize: number
    gridColor: string
    guides: Guide[]
}

const STORAGE_KEY = 'bring.visualDiff.wrapper.v1'
// The Figma personal access token is a credential, so it's kept out of the
// persisted overlay STATE and stored under its own key. It never leaves the
// browser except as the `X-Figma-Token` header on direct calls to the Figma
// REST API (used when the dev-only `/__figma-image` proxy isn't available,
// e.g. on the static hosted build).
const FIGMA_TOKEN_KEY = 'bring.visualDiff.figmaToken'

// Pull the file key + node id out of a Figma URL (design/file/board/proto).
const parseFigmaUrl = (url: string): { fileKey: string; nodeId: string } | null => {
    const fileMatch = url.match(/figma\.com\/(?:file|design|board|proto)\/([A-Za-z0-9]+)/)
    const nodeMatch = url.match(/[?&]node-id=([0-9]+[-:][0-9]+)/)
    if (!fileMatch || !nodeMatch) return null
    return { fileKey: fileMatch[1], nodeId: nodeMatch[1].replace('-', ':') }
}
const DEFAULTS: State = {
    src: '',
    x: 0,
    y: 0,
    scale: 1,
    opacity: 0.5,
    diff: false,
    invert: false,
    visible: true,
    locked: false,
    collapsed: false,
    border: false,
    grid: false,
    gridSize: 8,
    gridColor: '#FF2D9B',
    guides: [],
}

const loadState = (): State => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { ...DEFAULTS }
        return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<State>) }
    } catch {
        return { ...DEFAULTS }
    }
}

export const mountVisualDiffOverlay = (opts: { startExpanded?: boolean } = {}) => {
    let state = loadState()
    // The flag decides the initial collapsed state on every load, so toggling
    // VITE_VISUAL_DIFF reliably opens/closes the panel regardless of what was
    // persisted last time.
    state = { ...state, collapsed: !(opts.startExpanded ?? true) }
    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

    // Snapshot of scale/x/y taken right before "fit" so a second click can
    // restore it (toggle fit ⇄ unfit). Null = not currently fitted.
    let preFit: { scale: number; x: number; y: number } | null = null

    // Auto-fit the overlay to the portal iframe (scale image down/up so
    // its width matches the iframe), then center it horizontally. Falls
    // back to the viewport if the iframe isn't present.
    const fitAndCenter = () => {
        const apply = () => {
            if (!img.naturalWidth) return
            const portal = document.getElementById('portal') as HTMLIFrameElement | null
            const rect = portal?.getBoundingClientRect()
            const targetWidth = rect ? rect.width : window.innerWidth
            const targetLeft = rect ? rect.left : 0
            const scale = Number((targetWidth / img.naturalWidth).toFixed(4))
            const w = img.naturalWidth * scale
            state = { ...state, scale, x: Math.round(targetLeft + (targetWidth - w) / 2) }
            syncUi()
        }
        if (img.complete && img.naturalWidth) apply()
        else img.addEventListener('load', apply, { once: true })
    }
    // Center the overlay horizontally over the iframe without touching the
    // current scale.
    const centerXOnly = () => {
        const apply = () => {
            if (!img.naturalWidth) return
            const portal = document.getElementById('portal') as HTMLIFrameElement | null
            const rect = portal?.getBoundingClientRect()
            const targetWidth = rect ? rect.width : window.innerWidth
            const targetLeft = rect ? rect.left : 0
            const w = img.naturalWidth * state.scale
            state = { ...state, x: Math.round(targetLeft + (targetWidth - w) / 2) }
            syncUi()
        }
        if (img.complete && img.naturalWidth) apply()
        else img.addEventListener('load', apply, { once: true })
    }

    // --- overlay image -----------------------------------------------------
    const img = document.createElement('img')
    img.alt = ''
    img.draggable = false
    Object.assign(img.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        transformOrigin: 'top left',
        zIndex: '2147483646',
        userSelect: 'none',
    } as CSSStyleDeclaration)
    document.body.appendChild(img)

    const applyImg = () => {
        if (!state.src || !state.visible) {
            img.style.display = 'none'
            return
        }
        img.style.display = ''
        if (img.src !== state.src) img.src = state.src
        img.style.top = `${state.y}px`
        img.style.left = `${state.x}px`
        img.style.transform = `scale(${state.scale})`
        img.style.opacity = String(state.opacity)
        img.style.mixBlendMode = state.diff ? 'difference' : 'normal'
        img.style.filter = state.invert ? 'invert(1)' : 'none'
        // Outline (not border) so toggling it never shifts the image's size/pos.
        img.style.outline = state.border ? '2px solid #FF2D9B' : 'none'
        img.style.outlineOffset = state.border ? '-1px' : '0'
        img.style.pointerEvents = state.locked ? 'none' : 'auto'
        img.style.cursor = state.locked ? 'default' : 'move'
    }

    img.addEventListener('pointerdown', (e: PointerEvent) => {
        if (state.locked) return
        e.preventDefault()
        // Capture the pointer on the image so we keep getting move events even
        // when the cursor passes over the cross-origin portal iframe (which
        // would otherwise swallow them and freeze the drag).
        img.setPointerCapture(e.pointerId)
        const startX = e.clientX
        const startY = e.clientY
        const baseX = state.x
        const baseY = state.y
        const move = (ev: PointerEvent) => {
            state = { ...state, x: baseX + (ev.clientX - startX), y: baseY + (ev.clientY - startY) }
            applyImg()
            xInput.value = String(state.x)
            yInput.value = String(state.y)
        }
        const up = (ev: PointerEvent) => {
            img.removeEventListener('pointermove', move)
            img.removeEventListener('pointerup', up)
            img.removeEventListener('pointercancel', up)
            try { img.releasePointerCapture(ev.pointerId) } catch { /* already released */ }
            save()
        }
        img.addEventListener('pointermove', move)
        img.addEventListener('pointerup', up)
        img.addEventListener('pointercancel', up)
    })

    // --- pixel grid --------------------------------------------------------
    // Full-viewport ruler grid for eyeballing pixel alignment. Minor lines
    // every `gridSize` px, with a stronger major line every 8th cell. Sits
    // above the overlay image but below the panel, and never eats pointer
    // events so dragging the image/page still works through it.
    const grid = document.createElement('div')
    Object.assign(grid.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '2147483646',
        pointerEvents: 'none',
        display: 'none',
    } as CSSStyleDeclaration)
    document.body.appendChild(grid)

    const applyGrid = () => {
        if (!state.grid) {
            grid.style.display = 'none'
            return
        }
        const g = Math.max(1, state.gridSize)
        const major = g * 8
        // Both tiers share the chosen hue; alpha is appended as #RRGGBBAA
        // (73 ≈ 0.45 for major lines, 24 ≈ 0.14 for minor lines). Fall back to
        // the default pink if the stored value isn't a 6-digit hex.
        const hex = /^#[0-9a-fA-F]{6}$/.test(state.gridColor) ? state.gridColor : '#FF2D9B'
        grid.style.display = ''
        grid.style.backgroundImage = [
            `linear-gradient(to right, ${hex}73 1px, transparent 1px)`,
            `linear-gradient(to bottom, ${hex}73 1px, transparent 1px)`,
            `linear-gradient(to right, ${hex}24 1px, transparent 1px)`,
            `linear-gradient(to bottom, ${hex}24 1px, transparent 1px)`,
        ].join(',')
        grid.style.backgroundSize = `${major}px ${major}px, ${major}px ${major}px, ${g}px ${g}px, ${g}px ${g}px`
    }

    // --- guide lines -------------------------------------------------------
    // Draggable full-screen ruler guides (like a design tool). Each guide is a
    // 9px-wide hit strip with a 1px line drawn down its center; it's dragged
    // along its perpendicular axis and shows a live px readout. Double-click a
    // guide to remove it. Guides live in STATE so they persist across reloads.
    const GUIDE_COLOR = '#00E5FF'
    const guideEls = new Map<string, HTMLDivElement>()
    // Monotonic id source. Seed past any persisted ids so a reload + add never
    // reuses an existing id.
    let guideSeq = state.guides.reduce((m, g) => {
        const n = Number(g.id.replace(/^g/, ''))
        return Number.isFinite(n) ? Math.max(m, n + 1) : m
    }, 1)
    // The guide the pointer is currently hovering, so the Delete/Backspace key
    // knows which one to remove.
    let hoveredGuideId: string | null = null

    const removeGuide = (id: string) => {
        state = { ...state, guides: state.guides.filter(g => g.id !== id) }
        if (hoveredGuideId === id) hoveredGuideId = null
        renderGuides()
        save()
    }

    const positionGuide = (id: string) => {
        const el = guideEls.get(id)
        const guide = state.guides.find(g => g.id === id)
        if (!el || !guide) return
        const vertical = guide.axis === 'x'
        if (vertical) {
            Object.assign(el.style, { left: `${guide.pos - 4}px`, top: '0', bottom: '0', right: '', width: '9px', height: '' })
        } else {
            Object.assign(el.style, { top: `${guide.pos - 4}px`, left: '0', right: '0', bottom: '', height: '9px', width: '' })
        }
        const label = el.firstElementChild as HTMLElement | null
        if (label) label.textContent = String(guide.pos)
    }

    const makeGuideEl = (guide: Guide): HTMLDivElement => {
        const el = document.createElement('div')
        const vertical = guide.axis === 'x'
        Object.assign(el.style, {
            position: 'fixed',
            zIndex: '2147483646',
            background: vertical
                ? `linear-gradient(to right, transparent 4px, ${GUIDE_COLOR} 4px, ${GUIDE_COLOR} 5px, transparent 5px)`
                : `linear-gradient(to bottom, transparent 4px, ${GUIDE_COLOR} 4px, ${GUIDE_COLOR} 5px, transparent 5px)`,
            cursor: vertical ? 'ew-resize' : 'ns-resize',
            touchAction: 'none',
        } as CSSStyleDeclaration)
        el.title = 'Drag to move · double-click or Delete to remove'

        el.addEventListener('pointerenter', () => { hoveredGuideId = guide.id })
        el.addEventListener('pointerleave', () => { if (hoveredGuideId === guide.id) hoveredGuideId = null })

        const label = document.createElement('span')
        Object.assign(label.style, {
            position: 'absolute',
            background: GUIDE_COLOR,
            color: '#04222a',
            font: '10px/1 ui-monospace, SFMono-Regular, Menlo, monospace',
            padding: '1px 3px',
            borderRadius: '3px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
        } as CSSStyleDeclaration)
        // Pin the readout to the start of the line, just off the line itself.
        label.style[vertical ? 'top' : 'left'] = '2px'
        label.style[vertical ? 'left' : 'top'] = '6px'
        el.appendChild(label)

        el.addEventListener('pointerdown', (e: PointerEvent) => {
            e.preventDefault()
            e.stopPropagation()
            el.setPointerCapture(e.pointerId)
            const start = vertical ? e.clientX : e.clientY
            const cur = state.guides.find(g => g.id === guide.id)
            const base = cur ? cur.pos : guide.pos
            const move = (ev: PointerEvent) => {
                const pos = Math.round(base + ((vertical ? ev.clientX : ev.clientY) - start))
                state = { ...state, guides: state.guides.map(g => g.id === guide.id ? { ...g, pos } : g) }
                positionGuide(guide.id)
            }
            const up = (ev: PointerEvent) => {
                el.removeEventListener('pointermove', move)
                el.removeEventListener('pointerup', up)
                el.removeEventListener('pointercancel', up)
                try { el.releasePointerCapture(ev.pointerId) } catch { /* already released */ }
                save()
            }
            el.addEventListener('pointermove', move)
            el.addEventListener('pointerup', up)
            el.addEventListener('pointercancel', up)
        })

        el.addEventListener('dblclick', (e) => {
            e.preventDefault()
            e.stopPropagation()
            removeGuide(guide.id)
        })

        return el
    }

    // Reconcile guide DOM elements to state.guides (add new, drop removed,
    // reposition the rest). Cheap enough to run on every state change.
    const renderGuides = () => {
        const ids = new Set(state.guides.map(g => g.id))
        for (const [id, el] of guideEls) {
            if (!ids.has(id)) { el.remove(); guideEls.delete(id) }
        }
        for (const guide of state.guides) {
            if (!guideEls.has(guide.id)) {
                const el = makeGuideEl(guide)
                guideEls.set(guide.id, el)
                document.body.appendChild(el)
            }
            positionGuide(guide.id)
        }
    }

    const addGuide = (axis: 'x' | 'y') => {
        const id = `g${guideSeq++}`
        const pos = axis === 'x'
            ? Math.round(window.innerWidth / 2)
            : Math.round(window.innerHeight / 2)
        state = { ...state, guides: [...state.guides, { id, axis, pos }] }
        renderGuides()
        save()
    }

    // --- control panel -----------------------------------------------------
    const panel = document.createElement('div')
    Object.assign(panel.style, {
        position: 'fixed',
        top: '64px',
        right: '8px',
        zIndex: '2147483647',
        background: 'rgba(20,22,28,0.92)',
        color: '#F5F8FF',
        font: '12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #2a2d33',
        width: '240px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    } as CSSStyleDeclaration)
    document.body.appendChild(panel)
    panel.id = 'bring-visual-diff-panel'

    // Inject hover/active styling for the panel buttons so they read as
    // clickable (inline styles alone can't express :hover).
    const styleTag = document.createElement('style')
    styleTag.textContent = `
        #bring-visual-diff-panel button { transition: filter 0.12s, transform 0.05s; }
        #bring-visual-diff-panel button:hover { filter: brightness(1.25); }
        #bring-visual-diff-panel button:active { transform: translateY(1px); }
        #bring-visual-diff-panel input[type="text"],
        #bring-visual-diff-panel input[type="password"],
        #bring-visual-diff-panel input[type="number"] {
            transition: border-color 0.12s, box-shadow 0.12s, background 0.12s;
            outline: none;
        }
        #bring-visual-diff-panel input[type="text"]:focus:not([data-el="url"]),
        #bring-visual-diff-panel input[type="password"]:focus,
        #bring-visual-diff-panel input[type="number"]:focus {
            border-color: #FFEF46;
            box-shadow: 0 0 0 2px rgba(255,239,70,0.18);
            background: #11151c;
        }
        #bring-visual-diff-panel input::placeholder { color: #5b6068; }
        /* The URL field is a styled wrapper around a borderless input, so the
           focus ring lives on the wrapper via :focus-within. */
        #bring-visual-diff-panel [data-el="urlField"] {
            transition: border-color 0.12s, box-shadow 0.12s, background 0.12s;
        }
        #bring-visual-diff-panel [data-el="urlField"]:focus-within {
            border-color: #FFEF46;
            box-shadow: 0 0 0 2px rgba(255,239,70,0.18);
            background: #11151c;
        }
        #bring-visual-diff-panel [data-act="clearUrl"] { opacity: 0.6; }
        #bring-visual-diff-panel [data-act="clearUrl"]:hover { opacity: 1; }
    `
    document.head.appendChild(styleTag)

    panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
            <button data-act="collapse" title="Collapse / expand" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 7px;border-radius:4px;cursor:pointer;font:inherit;line-height:1">▾</button>
            <strong data-el="title" style="flex:1">Visual diff (wrapper)</strong>
            <button data-act="reset" data-el="resetBtn" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">reset</button>
        </div>
        <div data-el="body">
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="width:56px;color:#9aa0a6">Figma</span>
            <input type="text" data-el="figma" placeholder="figma.com/design/…?node-id=…" style="flex:1;background:#0e1116;color:#F5F8FF;border:1px solid #2a2d33;padding:2px 4px;border-radius:4px;font:inherit">
            <button data-act="fetchFigma" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">load</button>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="width:56px;color:#9aa0a6">Token</span>
            <input type="password" data-el="figmaToken" placeholder="Figma token (stored in this browser only)" autocomplete="off" style="flex:1;background:#0e1116;color:#F5F8FF;border:1px solid #2a2d33;padding:2px 4px;border-radius:4px;font:inherit">
        </div>
        <div data-el="figmaStatus" style="margin-top:4px;color:#9aa0a6;font-size:11px;min-height:14px"></div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <input type="file" data-el="file" accept="image/png,image/jpeg,image/webp" style="flex:1;min-width:0;font:inherit;color:#9aa0a6">
            <button data-act="paste" title="Paste an image from the clipboard (or press Ctrl/⌘+V anywhere)" style="flex:0 0 auto;background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">paste</button>
        </div>
        <div data-el="dropzone" style="margin-top:6px;border:2px dashed #2a2d33;border-radius:6px;padding:10px;text-align:center;color:#9aa0a6;cursor:copy;font-size:11px">Drop image / Figma asset here · or paste (Ctrl/⌘+V)</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="width:56px;color:#9aa0a6">URL</span>
            <div data-el="urlField" style="flex:1;min-width:0;display:flex;align-items:center;gap:4px;background:#0e1116;border:1px solid #2a2d33;border-radius:6px;padding:0 4px 0 7px">
                <span style="color:#66686E;flex:0 0 auto;line-height:1" aria-hidden="true">🔗</span>
                <input type="text" data-el="url" placeholder="https://… or data:…" style="flex:1;min-width:0;background:transparent;color:#F5F8FF;border:0;padding:5px 0;font:inherit;outline:none;text-overflow:ellipsis">
                <button data-act="clearUrl" title="Clear URL" style="flex:0 0 auto;background:transparent;color:#9aa0a6;border:0;cursor:pointer;font:inherit;padding:2px 3px;line-height:1">✕</button>
            </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="width:56px;color:#9aa0a6">X / Y</span>
            <input type="number" data-el="x" style="width:64px;background:#0e1116;color:#F5F8FF;border:1px solid #2a2d33;padding:2px 4px;border-radius:4px;font:inherit">
            <input type="number" data-el="y" style="width:64px;background:#0e1116;color:#F5F8FF;border:1px solid #2a2d33;padding:2px 4px;border-radius:4px;font:inherit">
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="width:56px;color:#9aa0a6">Scale</span>
            <input type="number" step="0.05" data-el="scale" style="width:64px;background:#0e1116;color:#F5F8FF;border:1px solid #2a2d33;padding:2px 4px;border-radius:4px;font:inherit">
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="width:56px;color:#9aa0a6">Opacity</span>
            <input type="range" min="0" max="1" step="0.05" data-el="opacity" style="flex:1">
            <span data-el="opacityVal" style="width:30px;text-align:right"></span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;margin-top:6px;flex-wrap:wrap">
            <button data-act="diff" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">diff</button>
            <button data-act="invert" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit" title="Invert the overlay image's colors">invert</button>
            <button data-act="border" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit" title="Outline the overlay image so its bounds are visible">border</button>
            <button data-act="fit" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit" title="Scale to iframe width and center">fit</button>
            <button data-act="center" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit" title="Center horizontally (keep scale)">center</button>
            <button data-act="visible" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">hide</button>
            <button data-act="locked" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">lock</button>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="width:56px;color:#9aa0a6">Grid</span>
            <button data-act="grid" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit" title="Toggle a pixel ruler grid over the page">grid</button>
            <input type="number" min="1" step="1" data-el="gridSize" title="Minor cell size in px (major line every 8th)" style="width:64px;background:#0e1116;color:#F5F8FF;border:1px solid #2a2d33;padding:2px 4px;border-radius:4px;font:inherit">
            <span style="color:#66686E;font-size:11px">px</span>
            <input type="color" data-el="gridColor" title="Grid line color" style="width:28px;height:24px;padding:0;background:#0e1116;border:1px solid #2a2d33;border-radius:4px;cursor:pointer">
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="width:56px;color:#9aa0a6">Guides</span>
            <button data-act="addGuideV" title="Add a vertical guide (drag it horizontally)" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">+ vert</button>
            <button data-act="addGuideH" title="Add a horizontal guide (drag it vertically)" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">+ horz</button>
            <button data-act="clearGuides" title="Remove all guides" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">clear</button>
        </div>
        <div data-el="inspectRow">
            <div style="display:flex;align-items:center;gap:4px;margin-top:6px;flex-wrap:wrap">
                <span style="width:56px;color:#9aa0a6">Inspect</span>
                <button data-act="pick" title="Highlight elements under the cursor (works inside the portal iframe too); click to lock — Esc to stop / clear" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">pick</button>
                <button data-act="alignPick" title="Move the overlay image's top-left onto the last picked element (keeps scale)" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">align</button>
                <button data-act="fitPick" title="Scale the overlay to the picked element's width, then align to it" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">fit→pick</button>
            </div>
            <div data-el="pickInfo" style="margin-top:4px;color:#9aa0a6;font-size:11px;min-height:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
        </div>
        <div style="margin-top:6px;color:#66686E;font-size:11px">arrows = 1px · shift+arrows = 10px</div>
        </div>
    `

    const q = <T extends HTMLElement>(sel: string) => panel.querySelector(sel) as T
    const fileInput = q<HTMLInputElement>('[data-el="file"]')
    const dropzone = q<HTMLDivElement>('[data-el="dropzone"]')
    const urlInput = q<HTMLInputElement>('[data-el="url"]')
    const figmaInput = q<HTMLInputElement>('[data-el="figma"]')
    const figmaTokenInput = q<HTMLInputElement>('[data-el="figmaToken"]')
    const figmaStatus = q<HTMLDivElement>('[data-el="figmaStatus"]')
    const xInput = q<HTMLInputElement>('[data-el="x"]')
    const yInput = q<HTMLInputElement>('[data-el="y"]')
    const scaleInput = q<HTMLInputElement>('[data-el="scale"]')
    const opacityInput = q<HTMLInputElement>('[data-el="opacity"]')
    const opacityVal = q<HTMLSpanElement>('[data-el="opacityVal"]')
    const diffBtn = q<HTMLButtonElement>('[data-act="diff"]')
    const invertBtn = q<HTMLButtonElement>('[data-act="invert"]')
    const borderBtn = q<HTMLButtonElement>('[data-act="border"]')
    const gridBtn = q<HTMLButtonElement>('[data-act="grid"]')
    const gridSizeInput = q<HTMLInputElement>('[data-el="gridSize"]')
    const gridColorInput = q<HTMLInputElement>('[data-el="gridColor"]')
    const pickBtn = q<HTMLButtonElement>('[data-act="pick"]')
    const pickInfo = q<HTMLElement>('[data-el="pickInfo"]')
    const inspectRow = q<HTMLDivElement>('[data-el="inspectRow"]')
    // The element inspector only works locally: it needs the portal-side picker
    // running inside the iframe, which is mounted only in DEV_MODE on the local
    // portal. On the hosted wrapper the iframe loads a prod portal without it,
    // so hide the row entirely rather than offer a control that can't work.
    const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(location.hostname)
    if (!isLocalHost) inspectRow.style.display = 'none'
    const fitBtn = q<HTMLButtonElement>('[data-act="fit"]')
    const visibleBtn = q<HTMLButtonElement>('[data-act="visible"]')
    const lockedBtn = q<HTMLButtonElement>('[data-act="locked"]')
    const collapseBtn = q<HTMLButtonElement>('[data-act="collapse"]')
    const resetBtn = q<HTMLButtonElement>('[data-el="resetBtn"]')
    const titleEl = q<HTMLElement>('[data-el="title"]')
    const body = q<HTMLDivElement>('[data-el="body"]')

    // Restore the saved Figma token (if any) and persist edits as they happen.
    figmaTokenInput.value = localStorage.getItem(FIGMA_TOKEN_KEY) ?? ''
    figmaTokenInput.addEventListener('input', () => {
        const t = figmaTokenInput.value.trim()
        if (t) localStorage.setItem(FIGMA_TOKEN_KEY, t)
        else localStorage.removeItem(FIGMA_TOKEN_KEY)
    })

    // Drag & drop (loading via the drop box / page-wide catcher, and dragging
    // the overlay to reposition it) is only active when the overlay is both
    // visible and unlocked.
    const dragEnabled = () => state.visible && !state.locked

    const syncUi = () => {
        const active = document.activeElement
        if (urlInput !== active) urlInput.value = state.src.startsWith('data:') ? '' : state.src
        if (xInput !== active) xInput.value = String(state.x)
        if (yInput !== active) yInput.value = String(state.y)
        if (scaleInput !== active) scaleInput.value = String(state.scale)
        if (opacityInput !== active) opacityInput.value = String(state.opacity)
        opacityVal.textContent = `${Math.round(state.opacity * 100)}%`
        diffBtn.style.background = state.diff ? '#FFEF46' : '#2a2d33'
        diffBtn.style.color = state.diff ? '#1F2018' : '#F5F8FF'
        invertBtn.style.background = state.invert ? '#FFEF46' : '#2a2d33'
        invertBtn.style.color = state.invert ? '#1F2018' : '#F5F8FF'
        borderBtn.style.background = state.border ? '#FFEF46' : '#2a2d33'
        borderBtn.style.color = state.border ? '#1F2018' : '#F5F8FF'
        gridBtn.style.background = state.grid ? '#FFEF46' : '#2a2d33'
        gridBtn.style.color = state.grid ? '#1F2018' : '#F5F8FF'
        if (gridSizeInput !== document.activeElement) gridSizeInput.value = String(state.gridSize)
        if (gridColorInput.value.toLowerCase() !== state.gridColor.toLowerCase()) gridColorInput.value = state.gridColor
        // Highlight "fit" while fitted; clicking again restores the prior size.
        fitBtn.style.background = preFit ? '#FFEF46' : '#2a2d33'
        fitBtn.style.color = preFit ? '#1F2018' : '#F5F8FF'
        fitBtn.title = preFit
            ? 'Restore previous size & position'
            : 'Scale to iframe width and center'
        visibleBtn.textContent = state.visible ? 'hide' : 'show'
        // Show the lock STATE (not just the action) and highlight when locked,
        // so it's obvious why the overlay can't be dragged.
        lockedBtn.textContent = state.locked ? '🔒 locked' : '🔓 movable'
        lockedBtn.style.background = state.locked ? '#FFEF46' : '#2a2d33'
        lockedBtn.style.color = state.locked ? '#1F2018' : '#F5F8FF'
        lockedBtn.title = state.locked
            ? 'Overlay is locked — click to allow dragging'
            : 'Overlay is draggable — click to lock it in place'
        // Drag & drop (the drop box + page-wide drop catcher) only makes sense
        // while the overlay is interactive: hide it when the overlay is locked
        // or hidden, restore it when visible and movable.
        dropzone.style.display = dragEnabled() ? '' : 'none'
        // Collapsed: shrink to a slim vertical tab; only the collapse button
        // (with the label rotated vertically) stays. Expanded: normal panel.
        body.style.display = state.collapsed ? 'none' : ''
        resetBtn.style.display = state.collapsed ? 'none' : ''
        titleEl.style.display = state.collapsed ? 'none' : ''
        panel.style.width = state.collapsed ? 'auto' : '240px'
        panel.style.padding = state.collapsed ? '6px' : '10px'
        if (state.collapsed) {
            collapseBtn.textContent = '▸ Visual diff'
            collapseBtn.style.writingMode = 'vertical-rl'
            collapseBtn.style.padding = '8px 5px'
            collapseBtn.title = 'Expand panel'
            // Flush against the right edge, rounded only on the left like a tab.
            panel.style.right = '0'
            panel.style.borderRadius = '8px 0 0 8px'
        } else {
            collapseBtn.textContent = '▾'
            collapseBtn.style.writingMode = ''
            collapseBtn.style.padding = '4px 7px'
            collapseBtn.title = 'Collapse panel'
            panel.style.right = '8px'
            panel.style.borderRadius = '8px'
        }
        applyImg()
        applyGrid()
        renderGuides()
        save()
    }

    // When loading a new image, default to scale 1 (real pixels) and just
    // center it. The user can still hit "fit" to auto-scale to iframe width.
    const resetScaleAndCenter = () => {
        preFit = null
        state = { ...state, scale: 1 }
        centerXOnly()
    }
    // Load an image File (from the file picker or a drag&drop) as the overlay.
    const loadFromFile = (f: File) => {
        const reader = new FileReader()
        reader.onload = () => {
            state = { ...state, src: String(reader.result), visible: true }
            syncUi()
            resetScaleAndCenter()
        }
        reader.onerror = () => { figmaStatus.textContent = `file read error: ${reader.error?.message ?? 'unknown'}` }
        reader.readAsDataURL(f)
    }
    fileInput.addEventListener('change', () => {
        const f = fileInput.files?.[0]
        if (!f) return
        loadFromFile(f)
    })
    // Explicit, always-visible drop target inside the panel. The panel lives
    // in the parent document (never under the cross-origin portal iframe), so
    // dropping here is reliable even when window-level drag detection misses
    // the initial dragenter over the iframe.
    const loadFromDataTransfer = (dt: DataTransfer | null): boolean => {
        if (!dt) return false
        const file = Array.from(dt.files || []).find(f => f.type.startsWith('image/'))
        if (file) { loadFromFile(file); return true }
        const url = (
            dt.getData('text/uri-list') ||
            imgUrlFromHtml(dt.getData('text/html')) ||
            dt.getData('text/plain') ||
            ''
        ).trim()
        if (!url) return false
        state = { ...state, src: url, visible: true }
        syncUi()
        resetScaleAndCenter()
        return true
    }
    // Pull an image off the clipboard via the async Clipboard API (used by the
    // "paste" button). The Ctrl+V `paste` event path below is preferred when
    // available; this is the click fallback and needs clipboard-read permission.
    const pasteFromClipboard = async () => {
        if (!navigator.clipboard?.read) {
            figmaStatus.textContent = 'Clipboard API unavailable — press Ctrl+V instead'
            return
        }
        try {
            const items = await navigator.clipboard.read()
            for (const item of items) {
                const type = item.types.find(t => t.startsWith('image/'))
                if (type) {
                    const blob = await item.getType(type)
                    loadFromFile(new File([blob], 'pasted-image', { type }))
                    figmaStatus.textContent = 'Pasted from clipboard'
                    return
                }
            }
            const text = (await navigator.clipboard.readText().catch(() => '')).trim()
            if (/^(https?:|data:)/i.test(text)) {
                state = { ...state, src: text, visible: true }
                syncUi()
                resetScaleAndCenter()
                figmaStatus.textContent = 'Pasted image URL'
                return
            }
            figmaStatus.textContent = 'Clipboard has no image'
        } catch (err) {
            figmaStatus.textContent = `Paste failed: ${err instanceof Error ? err.message : String(err)} (try Ctrl+V)`
        }
    }

    const dzOver = (e: DragEvent) => {
        if (!dragEnabled()) return
        e.preventDefault()
        e.stopPropagation()
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
        dropzone.style.borderColor = '#FFEF46'
        dropzone.style.color = '#F5F8FF'
    }
    const dzLeave = () => {
        dropzone.style.borderColor = '#2a2d33'
        dropzone.style.color = '#9aa0a6'
    }
    dropzone.addEventListener('dragenter', dzOver)
    dropzone.addEventListener('dragover', dzOver)
    dropzone.addEventListener('dragleave', dzLeave)
    dropzone.addEventListener('drop', (e: DragEvent) => {
        if (!dragEnabled()) return
        e.preventDefault()
        e.stopPropagation()
        dzLeave()
        loadFromDataTransfer(e.dataTransfer)
    })
    urlInput.addEventListener('blur', () => {
        const v = urlInput.value.trim()
        if (v && v !== state.src) {
            state = { ...state, src: v }
            syncUi()
            resetScaleAndCenter()
        }
    })
    const onNumberInput = (el: HTMLInputElement, key: 'x' | 'y' | 'scale' | 'opacity' | 'gridSize', fallback: number) => {
        el.addEventListener('input', () => {
            // Skip while the field is mid-edit (e.g. just `-` or empty) so we
            // don't replace the caret content; commit on blur instead.
            const raw = el.value
            if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return
            const n = Number(raw)
            if (!Number.isFinite(n)) return
            state = { ...state, [key]: n }
            syncUi()
        })
        el.addEventListener('blur', () => {
            const n = Number(el.value)
            state = { ...state, [key]: Number.isFinite(n) ? n : fallback }
            syncUi()
        })
    }
    onNumberInput(xInput, 'x', 0)
    onNumberInput(yInput, 'y', 0)
    onNumberInput(scaleInput, 'scale', 1)
    onNumberInput(opacityInput, 'opacity', 0.5)
    onNumberInput(gridSizeInput, 'gridSize', 8)
    gridColorInput.addEventListener('input', () => {
        state = { ...state, gridColor: gridColorInput.value }
        syncUi()
    })

    // --- element inspector (pick mode) -------------------------------------
    // Highlights the element under the cursor and shows `tag · W×H`. Clicking an
    // element LOCKS it: a persistent magenta box that stays put even after you
    // exit pick mode or click elsewhere (click a locked element again to
    // unlock; Esc clears all locks when not picking).
    //
    // On the wrapper page we read the DOM directly; inside the (cross-origin)
    // portal iframe we can't, so the portal-side picker
    // (src/utils/devElementPicker) draws its own hover/locked boxes there and
    // reports geometry + lock count back over postMessage.
    const PICK_TAG = 'bringweb3-devpick'
    const HOVER_COLOR = '#00E5FF'
    const LOCK_COLOR = '#FF2D9B'
    let pickActive = false
    let portalLockCount = 0
    // The most recently picked element, used as the target for "align". Wrapper
    // picks keep the element (recomputed live); portal picks keep the reported
    // iframe-local rect (re-offset by the iframe's live position at align time).
    type PickTarget =
        | { kind: 'wrapper'; el: Element }
        | { kind: 'portal'; rect: { x: number; y: number; width: number; height: number } }
    let lastPick: PickTarget | null = null

    const mkBox = (color: string, alpha: string) => {
        const b = document.createElement('div')
        Object.assign(b.style, {
            position: 'fixed', zIndex: '2147483646', pointerEvents: 'none',
            border: `1px solid ${color}`, background: alpha, boxSizing: 'border-box', display: 'none',
        } as CSSStyleDeclaration)
        document.body.appendChild(b)
        return b
    }
    // Single hover box (follows the cursor) + a persistent box per locked
    // wrapper-page element.
    const hoverBox = mkBox(HOVER_COLOR, 'rgba(0,229,255,0.12)')
    const wrapperLocks = new Map<Element, HTMLDivElement>()

    const portalFrame = () => document.getElementById('portal') as HTMLIFrameElement | null
    const postToPortal = (data: Record<string, unknown>) => {
        const frame = portalFrame()
        if (!frame?.contentWindow || !frame.src) return
        try {
            frame.contentWindow.postMessage({ ...data, to: PICK_TAG }, new URL(frame.src).origin)
        } catch { /* iframe not ready / bad src */ }
    }

    // Our own overlay chrome shouldn't be pickable.
    const isOwnUi = (el: Element): boolean =>
        el === hoverBox || el === panel || panel.contains(el) || el === img || el === grid ||
        wrapperLocks.has(el) || [...wrapperLocks.values()].some(b => b === el) ||
        [...guideEls.values()].some(g => g === el)

    const describeEl = (el: Element): string => {
        const r = el.getBoundingClientRect()
        const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : ''
        return `${el.tagName.toLowerCase()}${id} · ${Math.round(r.width)}×${Math.round(r.height)}`
    }
    const placeBox = (box: HTMLDivElement, el: Element) => {
        const r = el.getBoundingClientRect()
        Object.assign(box.style, {
            display: '', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
        })
    }

    const totalLocks = () => wrapperLocks.size + portalLockCount
    const updatePickButton = () => {
        const n = totalLocks()
        if (pickActive) {
            pickBtn.textContent = 'picking… (Esc)'
            pickBtn.style.background = '#FFEF46'; pickBtn.style.color = '#1F2018'
        } else if (n > 0) {
            pickBtn.textContent = `picked ${n} (Esc clears)`
            pickBtn.style.background = LOCK_COLOR; pickBtn.style.color = '#1F2018'
        } else {
            pickBtn.textContent = 'pick'
            pickBtn.style.background = '#2a2d33'; pickBtn.style.color = '#F5F8FF'
        }
    }

    // Keep locked boxes pinned to their elements as the page scrolls/resizes.
    let reposAttached = false
    const repositionLocks = () => {
        for (const [el, box] of wrapperLocks) {
            if (!el.isConnected) { box.remove(); wrapperLocks.delete(el); continue }
            placeBox(box, el)
        }
        if (wrapperLocks.size === 0) detachReposition()
    }
    const attachReposition = () => {
        if (reposAttached) return
        reposAttached = true
        window.addEventListener('scroll', repositionLocks, true)
        window.addEventListener('resize', repositionLocks)
    }
    function detachReposition() {
        if (!reposAttached) return
        reposAttached = false
        window.removeEventListener('scroll', repositionLocks, true)
        window.removeEventListener('resize', repositionLocks)
    }

    const toggleWrapperLock = (el: Element) => {
        const existing = wrapperLocks.get(el)
        if (existing) {
            existing.remove(); wrapperLocks.delete(el)
            if (wrapperLocks.size === 0) detachReposition()
            if (lastPick?.kind === 'wrapper' && lastPick.el === el) lastPick = null
        } else {
            const box = mkBox(LOCK_COLOR, 'rgba(255,45,155,0.12)')
            placeBox(box, el)
            wrapperLocks.set(el, box)
            attachReposition()
            lastPick = { kind: 'wrapper', el }
        }
        updatePickButton()
    }

    const clearAllLocks = () => {
        for (const box of wrapperLocks.values()) box.remove()
        wrapperLocks.clear()
        detachReposition()
        portalLockCount = 0
        lastPick = null
        postToPortal({ action: 'CLEAR_LOCKS' })
        updatePickButton()
    }

    // The pick target's box in page (viewport) coordinates. For portal picks we
    // add the iframe's current position so the alignment tracks the iframe even
    // if the wrapper layout shifted since the pick.
    const pickTargetPageRect = (): { x: number; y: number; width: number; height: number } | null => {
        if (!lastPick) return null
        if (lastPick.kind === 'wrapper') {
            if (!lastPick.el.isConnected) return null
            const r = lastPick.el.getBoundingClientRect()
            return { x: r.left, y: r.top, width: r.width, height: r.height }
        }
        const fr = portalFrame()?.getBoundingClientRect()
        const ox = fr ? fr.left : 0
        const oy = fr ? fr.top : 0
        const r = lastPick.rect
        return { x: ox + r.x, y: oy + r.y, width: r.width, height: r.height }
    }

    // Align the overlay image to the last picked element. `scaleToWidth` also
    // scales the image (uniformly) so its width matches the element's.
    const alignToPick = (scaleToWidth: boolean) => {
        const rect = pickTargetPageRect()
        if (!rect) { pickInfo.textContent = 'Pick an element first (click one in pick mode)'; return }
        if (!state.src) { pickInfo.textContent = 'Load an image first'; return }
        let scale = state.scale
        if (scaleToWidth) {
            if (!img.naturalWidth) { pickInfo.textContent = 'Image not loaded yet'; return }
            scale = Number((rect.width / img.naturalWidth).toFixed(4))
        }
        preFit = null
        state = { ...state, x: Math.round(rect.x), y: Math.round(rect.y), scale, visible: true }
        syncUi()
        pickInfo.textContent = `Aligned to ${Math.round(rect.width)}×${Math.round(rect.height)}${scaleToWidth ? ` @ ${scale}×` : ''}`
    }

    const onPickMove = (e: PointerEvent) => {
        const el = e.target as Element | null
        // Over the iframe, the portal-side picker handles the highlight.
        if (!el || el === portalFrame() || isOwnUi(el)) { hoverBox.style.display = 'none'; return }
        placeBox(hoverBox, el)
        pickInfo.textContent = describeEl(el)
    }
    const onPickClick = (e: MouseEvent) => {
        const el = e.target as Element | null
        // Let panel buttons (incl. the pick button itself) work normally;
        // clicks inside the iframe never reach us (the portal handles them).
        if (!el || el === portalFrame() || isOwnUi(el)) return
        e.preventDefault()
        e.stopPropagation()
        toggleWrapperLock(el)
    }

    const setPickActive = (on: boolean) => {
        if (on === pickActive) return
        pickActive = on
        postToPortal({ action: 'SET_PICK', enabled: on })
        if (on) {
            document.addEventListener('pointermove', onPickMove, true)
            document.addEventListener('click', onPickClick, true)
        } else {
            document.removeEventListener('pointermove', onPickMove, true)
            document.removeEventListener('click', onPickClick, true)
            hoverBox.style.display = 'none'
            pickInfo.textContent = ''
        }
        updatePickButton()
    }

    // Reports from the portal-side picker for elements inside the iframe: a
    // hover/pick readout, and the iframe's locked-box count (so our button can
    // show the combined total). The portal draws its own boxes.
    window.addEventListener('message', (e: MessageEvent) => {
        const d = e.data as { from?: string; action?: string; tag?: string; id?: string; count?: number; rect?: { x: number; y: number; width: number; height: number } } | null
        if (!d || d.from !== PICK_TAG) return
        if (d.action === 'LOCKS') {
            portalLockCount = d.count ?? 0
            updatePickButton()
        } else if ((d.action === 'HOVER' || d.action === 'PICK') && pickActive) {
            const id = d.id ? `#${d.id}` : ''
            const size = d.rect ? ` · ${Math.round(d.rect.width)}×${Math.round(d.rect.height)}` : ''
            pickInfo.textContent = `${d.tag ?? '?'}${id}${size}`
            // Remember a committed pick (click) inside the iframe as the align
            // target. rect is iframe-local; pickTargetPageRect() re-offsets it.
            if (d.action === 'PICK' && d.rect) lastPick = { kind: 'portal', rect: d.rect }
        }
    })

    panel.addEventListener('click', (e) => {
        const t = e.target as HTMLElement
        const act = t.getAttribute('data-act')
        if (!act) return
        if (act === 'reset') { state = { ...DEFAULTS }; preFit = null; syncUi() }
        else if (act === 'clearUrl') { state = { ...state, src: '' }; urlInput.value = ''; syncUi(); urlInput.focus() }
        else if (act === 'paste') { void pasteFromClipboard() }
        else if (act === 'pick') { setPickActive(!pickActive) }
        else if (act === 'alignPick') { alignToPick(false) }
        else if (act === 'fitPick') { alignToPick(true) }
        else if (act === 'collapse') { state = { ...state, collapsed: !state.collapsed }; syncUi() }
        else if (act === 'diff') { state = { ...state, diff: !state.diff }; syncUi() }
        else if (act === 'invert') { state = { ...state, invert: !state.invert }; syncUi() }
        else if (act === 'border') { state = { ...state, border: !state.border }; syncUi() }
        else if (act === 'grid') { state = { ...state, grid: !state.grid }; syncUi() }
        else if (act === 'addGuideV') { addGuide('x') }
        else if (act === 'addGuideH') { addGuide('y') }
        else if (act === 'clearGuides') { state = { ...state, guides: [] }; renderGuides(); save() }
        else if (act === 'fit') {
            if (preFit) {
                // Second click: un-fit, restoring the size/position from before.
                const { scale, x, y } = preFit
                preFit = null
                state = { ...state, scale, x, y }
                syncUi()
            } else {
                preFit = { scale: state.scale, x: state.x, y: state.y }
                fitAndCenter()
                syncUi()
            }
        }
        else if (act === 'center') { centerXOnly() }
        else if (act === 'visible') { state = { ...state, visible: !state.visible }; syncUi() }
        else if (act === 'locked') { state = { ...state, locked: !state.locked }; syncUi() }
        else if (act === 'fetchFigma') {
            const url = figmaInput.value.trim()
            if (!url) { figmaStatus.textContent = 'Paste a Figma URL with a node-id'; return }
            const token = figmaTokenInput.value.trim()
            figmaStatus.textContent = 'Loading…'

            // With a token: call the Figma REST API straight from the browser
            // (works on the hosted static build, where the dev proxy is absent).
            // Without one: fall back to the dev-only `/__figma-image` proxy.
            const loader = token
                ? (async (): Promise<string> => {
                    const parsed = parseFigmaUrl(url)
                    if (!parsed) throw new Error('Expected a Figma URL with a node-id')
                    const { fileKey, nodeId } = parsed
                    const r = await fetch(
                        `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=1`,
                        { headers: { 'X-Figma-Token': token } },
                    )
                    const data = await r.json() as { images?: Record<string, string | null>; err?: string }
                    if (!r.ok) throw new Error(data.err || `Figma API ${r.status}`)
                    const imageUrl = data.images?.[nodeId]
                    if (!imageUrl) throw new Error(`No image returned for node ${nodeId}`)
                    return imageUrl
                })
                : (async (): Promise<string> => {
                    const r = await fetch(`/__figma-image?url=${encodeURIComponent(url)}`)
                    const data = await r.json() as { imageUrl?: string; error?: string }
                    if (!r.ok || !data.imageUrl) throw new Error(data.error ?? `HTTP ${r.status}`)
                    return data.imageUrl
                })

            loader()
                .then(src => {
                    state = { ...state, src }
                    figmaStatus.textContent = 'Loaded'
                    syncUi()
                    resetScaleAndCenter()
                })
                .catch(err => { figmaStatus.textContent = err instanceof Error ? err.message : String(err) })
        }
    })

    window.addEventListener('keydown', (e) => {
        // Esc exits pick mode; a second Esc (or Esc when not picking) clears
        // any locked highlights. Allowed even when a field is focused.
        if (e.key === 'Escape') {
            if (pickActive) { e.preventDefault(); setPickActive(false); return }
            if (totalLocks() > 0) { e.preventDefault(); clearAllLocks(); return }
        }
        const tgt = e.target as HTMLElement | null
        if (tgt && /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName)) return
        // Delete/Backspace removes the guide the pointer is hovering.
        if ((e.key === 'Delete' || e.key === 'Backspace') && hoveredGuideId) {
            e.preventDefault()
            removeGuide(hoveredGuideId)
            return
        }
        const step = e.shiftKey ? 10 : 1
        if (e.key === 'ArrowLeft') state = { ...state, x: state.x - step }
        else if (e.key === 'ArrowRight') state = { ...state, x: state.x + step }
        else if (e.key === 'ArrowUp') state = { ...state, y: state.y - step }
        else if (e.key === 'ArrowDown') state = { ...state, y: state.y + step }
        else return
        e.preventDefault()
        syncUi()
    })

    // Ctrl/⌘+V anywhere pastes an image (or copied Figma frame) onto the
    // overlay. Reuses the drag&drop extractor since a ClipboardEvent's
    // clipboardData is a DataTransfer. Ignored while typing in a field so
    // normal text paste still works there.
    window.addEventListener('paste', (e: ClipboardEvent) => {
        const tgt = e.target as HTMLElement | null
        if (tgt && /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName)) return
        if (loadFromDataTransfer(e.clipboardData)) e.preventDefault()
    })

    syncUi()
    if (state.src) centerXOnly()

    // --- drag & drop -------------------------------------------------------
    // Drop a Figma image anywhere on the page to load it as the overlay.
    // Works with image files (from disk) and with images dragged straight
    // out of Figma / another browser tab (which arrive as a URL).
    //
    // The portal lives in a (cross-origin) <iframe>, which swallows drag
    // events while the pointer is over it. To work around that, a
    // full-viewport catcher is shown (above the iframe) as soon as a drag
    // carrying an image is detected, so the drop always lands on the wrapper.
    // Visibility is driven by a timeout that refreshes on every `dragover`
    // and clears on drop — this avoids the flaky `dragleave`/`relatedTarget`
    // behaviour you get with cross-origin iframes.
    const dropHint = document.createElement('div')
    Object.assign(dropHint.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '2147483645',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(12,15,20,0.55)',
    } as CSSStyleDeclaration)
    const dropHintInner = document.createElement('div')
    Object.assign(dropHintInner.style, {
        border: '3px dashed #FFEF46',
        borderRadius: '12px',
        padding: '24px 36px',
        background: 'rgba(20,22,28,0.9)',
        color: '#F5F8FF',
        font: '600 16px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
        textAlign: 'center',
        pointerEvents: 'none',
    } as CSSStyleDeclaration)
    dropHintInner.textContent = 'Drop Figma image to overlay'
    dropHint.appendChild(dropHintInner)
    document.body.appendChild(dropHint)

    let hideTimer = 0
    const hideHint = () => { window.clearTimeout(hideTimer); dropHint.style.display = 'none' }
    const scheduleHide = () => {
        window.clearTimeout(hideTimer)
        hideTimer = window.setTimeout(() => { dropHint.style.display = 'none' }, 250)
    }

    const carriesImage = (dt: DataTransfer | null) =>
        !!dt && Array.from(dt.types || []).some(t =>
            t === 'Files' || t === 'text/uri-list' || t === 'text/plain' || t === 'text/html')

    const imgUrlFromHtml = (html: string): string => {
        const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
        return m ? m[1] : ''
    }

    // Show the catcher and keep the drop allowed for the whole drag. Using
    // capture so these fire before the iframe (or anything else) can consume
    // the event, and on every dragover so the timeout never lapses mid-drag.
    const onDragActive = (e: DragEvent) => {
        if (!dragEnabled()) return
        if (!carriesImage(e.dataTransfer)) return
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
        dropHint.style.display = 'flex'
        scheduleHide()
    }
    window.addEventListener('dragenter', onDragActive, true)
    window.addEventListener('dragover', onDragActive, true)
    window.addEventListener('dragend', hideHint, true)

    window.addEventListener('drop', (e: DragEvent) => {
        if (!dragEnabled()) return
        const dt = e.dataTransfer
        if (!dt || !carriesImage(dt)) return
        e.preventDefault()
        hideHint()
        const file = Array.from(dt.files || []).find(f => f.type.startsWith('image/'))
        if (file) { loadFromFile(file); return }
        const url = (
            dt.getData('text/uri-list') ||
            imgUrlFromHtml(dt.getData('text/html')) ||
            dt.getData('text/plain') ||
            ''
        ).trim()
        if (!url) return
        state = { ...state, src: url, visible: true }
        syncUi()
        resetScaleAndCenter()
    }, true)
}
