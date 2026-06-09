/**
 * Pure utilities for parsing backend-formatted token amount display strings.
 *
 * The backend returns token amounts as { value, display }. The `display` field
 * is a plain string that may contain Unicode subscript characters (₀–₉,
 * U+2080–U+2089) for very small values. Example: "0.0₂12" means "0.0" then
 * two zeros (subscript 2) then "12" — i.e. 0.00012.
 *
 * These utilities convert that string into structured parts so a renderer can
 * wrap each subscript run in a semantic <sub> element. The parsing is kept
 * separate from any React component so it can be reused (e.g. from the
 * existing desktop portal later).
 */

/** Unicode subscript digits U+2080–U+2089 mapped to their ASCII counterparts. */
const SUBSCRIPT_TO_ASCII: Record<string, string> = {
    '\u2080': '0',
    '\u2081': '1',
    '\u2082': '2',
    '\u2083': '3',
    '\u2084': '4',
    '\u2085': '5',
    '\u2086': '6',
    '\u2087': '7',
    '\u2088': '8',
    '\u2089': '9',
}

/** Matches one or more consecutive Unicode subscript digits. */
const SUBSCRIPT_RUN_REGEX = /[\u2080-\u2089]+/g

export type TokenAmountPart =
    | { type: 'text'; content: string }
    | { type: 'sub'; content: string }

/**
 * Parse a backend display string into an ordered list of parts.
 *
 * - Plain text runs become `{ type: 'text', content }`.
 * - Each contiguous run of Unicode subscript digits becomes
 *   `{ type: 'sub', content }` with the digits converted to ASCII.
 *
 * Examples:
 *   parseTokenDisplay("1234")    → [{ type: 'text', content: '1234' }]
 *   parseTokenDisplay("0.0₂12")  → [
 *     { type: 'text', content: '0.0' },
 *     { type: 'sub',  content: '2'   },
 *     { type: 'text', content: '12'  },
 *   ]
 *
 * A `null`/`undefined`/empty input returns an empty array — callers decide
 * how to render that case.
 */
export const parseTokenDisplay = (display: string | null | undefined): TokenAmountPart[] => {
    if (!display) return []

    const parts: TokenAmountPart[] = []
    let lastIndex = 0

    for (const match of display.matchAll(SUBSCRIPT_RUN_REGEX)) {
        const matchIndex = match.index!

        if (matchIndex > lastIndex) {
            parts.push({ type: 'text', content: display.slice(lastIndex, matchIndex) })
        }

        const ascii = Array.from(match[0], ch => SUBSCRIPT_TO_ASCII[ch] ?? ch).join('')
        parts.push({ type: 'sub', content: ascii })

        lastIndex = matchIndex + match[0].length
    }

    if (lastIndex < display.length) {
        parts.push({ type: 'text', content: display.slice(lastIndex) })
    }

    return parts
}

/**
 * Convenience: returns `true` if the display string contains any Unicode
 * subscript characters. Useful for skipping `<sub>` wrapping at call sites
 * that want to render plain text in the common case.
 */
export const hasSubscript = (display: string | null | undefined): boolean => {
    if (!display) return false
    // Non-global, stateless test — a global regex's `lastIndex` would persist
    // between calls and corrupt the `matchAll` scan in parseTokenDisplay.
    return /[₀-₉]/.test(display)
}
