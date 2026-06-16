/**
 * Logic hook for the Search bar. Owns all state, refs, ids, effects and
 * handlers; returns a flat view-model the .tsx renders verbatim. Keeps the
 * component file free of state/logic so it is pure UI.
 */
import {
    KeyboardEvent,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from 'use-debounce'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'

export interface SearchSuggestion {
    id: string
    name: string
}

export interface SearchProps {
    value: string
    onChange: (value: string) => void
    onClose: () => void
    suggestions?: SearchSuggestion[]
    onSelectSuggestion?: (name: string) => void
    showNoResults?: boolean
    showDropdown?: boolean
}

export const useSearch = ({
    value,
    onChange,
    onClose,
    suggestions = [],
    onSelectSuggestion,
    showNoResults = false,
    showDropdown = false,
}: SearchProps) => {
    const { t } = useTranslation()
    const { sendGaEvent } = useGoogleAnalytics()
    const inputRef = useRef<HTMLInputElement>(null)
    const listboxId = useId()

    // -1 = no row highlighted; Enter then commits suggestions[0] or value.
    const [activeIndex, setActiveIndex] = useState(-1)

    useEffect(() => setActiveIndex(-1), [suggestions])
    useEffect(() => inputRef.current?.focus(), [])

    // Debounced typed value drives the GA search_input event only (not the
    // filter) — mirrors desktop Search so search usage is tracked.
    const [debouncedValue] = useDebounce(value, 500)
    useEffect(() => {
        const trimmed = debouncedValue.trim()
        if (!trimmed) return
        sendGaEvent('search_input', {
            category: 'user_action',
            action: 'input',
            details: trimmed,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedValue])

    const optionId = useCallback(
        (id: string) => `${listboxId}-opt-${id}`,
        [listboxId],
    )

    const commit = useCallback(
        (name: string) => {
            const trimmed = name.trim()
            if (!trimmed) return
            sendGaEvent('search_select', {
                category: 'user_action',
                action: 'select',
                details: trimmed,
            })
            onSelectSuggestion?.(trimmed)
        },
        [onSelectSuggestion, sendGaEvent],
    )

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()
            const picked = suggestions[activeIndex]?.name ?? suggestions[0]?.name ?? value
            commit(picked)
        },
        [activeIndex, suggestions, value, commit],
    )

    // Empty input → trailing icon doubles as a close affordance.
    const handleIconClick = useCallback(() => {
        if (!value.trim()) onClose()
    }, [value, onClose])

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
                return
            }
            if (!suggestions.length) return
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((i) => (i + 1) % suggestions.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
            }
        },
        [suggestions.length, onClose],
    )

    const activeDescendant =
        activeIndex >= 0 && activeIndex < suggestions.length
            ? optionId(suggestions[activeIndex].id)
            : undefined

    return {
        t,
        inputRef,
        listboxId,
        activeIndex,
        activeDescendant,
        optionId,
        commit,
        value,
        onChange,
        suggestions,
        showDropdown,
        showNoResults,
        handleSubmit,
        handleIconClick,
        handleKeyDown,
    }
}
