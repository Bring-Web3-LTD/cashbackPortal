/**
 * Input mechanics for a row of one-character OTP boxes: the refs, the caret
 * hops, and the paste / soft-keyboard / physical-keyboard quirks.
 *
 * Presentation only — it holds no flow state. The digits themselves belong to
 * whoever is running the flow (usePairWallet), which is why `code` and
 * `setCode` are passed in: a view that renders a single text field instead of
 * boxes just skips this hook entirely.
 */
import { useRef, KeyboardEvent } from 'react'

interface Params {
    code: string[]
    setCode: (update: (prev: string[]) => string[]) => void
    /** Box count — the caret never parks past `length - 1`. */
    length: number
    /** Typing clears the inline error; the empty-box case deliberately does not. */
    onEdit: () => void
}

export const useOtpInputs = ({ code, setCode, length, onEdit }: Params) => {
    const digitRefs = useRef<(HTMLInputElement | null)[]>([])

    /** Writes `digits` from `index` on and parks the caret after the last one. */
    const fillFrom = (index: number, digits: string) => {
        setCode(prev => {
            const next = [...prev]
            for (let i = 0; i < digits.length && index + i < prev.length; i++) {
                next[index + i] = digits[i]
            }
            return next
        })
        onEdit()
        digitRefs.current[Math.min(index + digits.length, length - 1)]?.focus()
    }

    /** Paste, autofill and soft keyboards, which do not report a usable `key`.
     *  A box already holding a digit sends its old value along with the new
     *  one, so only the tail — what is actually new — is written. */
    const handleDigitChange = (index: number, value: string) => {
        const digits = value.replace(/\D/g, '')
        if (!digits) {
            setCode(prev => prev.map((d, i) => (i === index ? '' : d)))
            return
        }
        const typed = code[index] && digits.length > 1 ? digits.slice(1) : digits
        fillFrom(index, typed)
    }

    /** Physical keyboards: a digit overwrites the box whatever it already holds
     *  and moves on, so retyping over a filled code never needs a select first
     *  (`maxLength` would otherwise swallow the keystroke). */
    const handleDigitKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (/^\d$/.test(e.key)) {
            e.preventDefault()
            fillFrom(index, e.key)
            return
        }
        if (e.key === 'Backspace' && !code[index]) digitRefs.current[index - 1]?.focus()
    }

    return {
        digitRefs,
        handleDigitChange,
        handleDigitKeyDown,
        focusFirst: () => digitRefs.current[0]?.focus(),
    }
}
