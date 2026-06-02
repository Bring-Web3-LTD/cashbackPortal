/**
 * Dev-only visual-diff overlay for the dev-wrapper.
 *
 * Drop a Figma PNG export over the running wrapper page to pixel-compare
 * layouts. Enable by adding `?visualDiff=1` to the URL (the flag is then
 * persisted to localStorage so reloads keep it on).
 *
 * Controls:
 *   - File picker, URL field, or drag & drop to load an image (drop a PNG
 *     from disk, or drag an image straight out of Figma / another tab)
 *   - X / Y / scale / opacity inputs
 *   - Drag the overlay image to position it (arrow keys nudge 1px,
 *     shift+arrows 10px)
 *   - `diff` toggles `mix-blend-mode: difference` (matching pixels go black)
 *   - `hide` / `lock` / `reset`
 *
 * Note: this overlays the dev-wrapper page itself, NOT the portal inside the
 * iframe. To overlay the portal, open the portal directly with `?visualDiff=1`
 * (the React mount in `src/dev/VisualDiffOverlay.tsx` handles that case).
 */

type State = {
    src: string
    x: number
    y: number
    scale: number
    opacity: number
    diff: boolean
    visible: boolean
    locked: boolean
    collapsed: boolean
    border: boolean
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
    visible: true,
    locked: false,
    collapsed: false,
    border: false,
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
        <div style="margin-top:6px"><input type="file" data-el="file" accept="image/png,image/jpeg,image/webp" style="font:inherit;color:#9aa0a6"></div>
        <div data-el="dropzone" style="margin-top:6px;border:2px dashed #2a2d33;border-radius:6px;padding:10px;text-align:center;color:#9aa0a6;cursor:copy;font-size:11px">Drop image / Figma asset here</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="width:56px;color:#9aa0a6">URL</span>
            <input type="text" data-el="url" placeholder="https://… or data:…" style="width:160px;background:#0e1116;color:#F5F8FF;border:1px solid #2a2d33;padding:2px 4px;border-radius:4px;font:inherit">
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
            <button data-act="border" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit" title="Outline the overlay image so its bounds are visible">border</button>
            <button data-act="fit" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit" title="Scale to iframe width and center">fit</button>
            <button data-act="center" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit" title="Center horizontally (keep scale)">center</button>
            <button data-act="visible" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">hide</button>
            <button data-act="locked" style="background:#2a2d33;color:#F5F8FF;border:0;padding:4px 8px;border-radius:4px;cursor:pointer;font:inherit">lock</button>
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
    const borderBtn = q<HTMLButtonElement>('[data-act="border"]')
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
        borderBtn.style.background = state.border ? '#FFEF46' : '#2a2d33'
        borderBtn.style.color = state.border ? '#1F2018' : '#F5F8FF'
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
    const onNumberInput = (el: HTMLInputElement, key: 'x' | 'y' | 'scale' | 'opacity', fallback: number) => {
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

    panel.addEventListener('click', (e) => {
        const t = e.target as HTMLElement
        const act = t.getAttribute('data-act')
        if (!act) return
        if (act === 'reset') { state = { ...DEFAULTS }; preFit = null; syncUi() }
        else if (act === 'collapse') { state = { ...state, collapsed: !state.collapsed }; syncUi() }
        else if (act === 'diff') { state = { ...state, diff: !state.diff }; syncUi() }
        else if (act === 'border') { state = { ...state, border: !state.border }; syncUi() }
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
        const tgt = e.target as HTMLElement | null
        if (tgt && /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName)) return
        const step = e.shiftKey ? 10 : 1
        if (e.key === 'ArrowLeft') state = { ...state, x: state.x - step }
        else if (e.key === 'ArrowRight') state = { ...state, x: state.x + step }
        else if (e.key === 'ArrowUp') state = { ...state, y: state.y - step }
        else if (e.key === 'ArrowDown') state = { ...state, y: state.y + step }
        else return
        e.preventDefault()
        syncUi()
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
