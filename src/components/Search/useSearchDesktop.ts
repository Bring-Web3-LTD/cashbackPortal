/**
 * Logic hook for the desktop search box. Owns the input, the filtered
 * suggestions, the menu/focus state and the analytics — so the view is pure
 * UI and only wires react-select up.
 *
 * Named for the surface because `useSearch` is the mobile search's hook.
 */
import { useEffect, useId, useRef, useState, MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from 'use-debounce'
import type { SelectInstance, SingleValue, MultiValue } from 'react-select'
import { useAnalytics } from '../../hooks/useAnalytics'

/** Matches on a word start, with whole-label matches ahead of later words. */
const filterOptions = (options: ReactSelectOptionType[], raw: string) => {
    const input = raw.trimStart().toLowerCase()
    if (!options?.length) return []

    const leading: ReactSelectOptionType[] = []
    const laterWord: ReactSelectOptionType[] = []

    options.forEach((option) => {
        const label = option.label.toLowerCase()
        if (label.startsWith(input)) {
            leading.push(option)
        } else if (label.includes(' ') && label.split(/\s+/).some(word => word.startsWith(input))) {
            laterWord.push(option)
        }
    })

    return leading.concat(laterWord)
}

interface Args {
    options: ReactSelectOptionType[]
    onChangeFn: (value: ReactSelectOptionType) => void
}

export const useSearchDesktop = ({ options, onChangeFn }: Args) => {
    const id = useId()
    const { t } = useTranslation()
    const { sendAnalyticsEvent } = useAnalytics()
    const [input, setInput] = useState('')
    const [debouncedInput] = useDebounce(input, 500)
    const [filteredOptions, setFilteredOptions] = useState<ReactSelectOptionType[]>(options)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const selectRef = useRef<SelectInstance<ReactSelectOptionType> | null>(null)

    useEffect(() => {
        if (!debouncedInput.length) return
        sendAnalyticsEvent("search_input", {
            category: "user_action",
            action: "input",
            details: debouncedInput,
            hasResults: !!filteredOptions.length,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedInput])

    const handleChange = (
        item: SingleValue<ReactSelectOptionType> | MultiValue<ReactSelectOptionType> | null,
    ) => {
        if (!item || Array.isArray(item)) return
        const { value } = item as ReactSelectOptionType

        sendAnalyticsEvent("search_select", {
            category: "user_action",
            action: "select",
            details: value,
        })

        onChangeFn({ value, label: value })
        // Blurring fires the Select's onBlur, which sets isFocused(false) –
        // keep focus state driven by a single source (the blur event).
        selectRef.current?.blur()
    }

    // One character is not enough to narrow anything, so the menu stays shut.
    const handleInputChange = (inputValue: string) => {
        setInput(inputValue)

        if (!inputValue || inputValue.trim().length < 2) {
            if (isMenuOpen) setIsMenuOpen(false)
            if (filteredOptions.length) setFilteredOptions([])
            return
        }

        if (!isMenuOpen) setIsMenuOpen(true)
        setFilteredOptions(filterOptions(options, inputValue))
    }

    return {
        id,
        selectRef,
        filteredOptions,
        isMenuOpen,
        isFocused,
        handleChange,
        handleInputChange,
        // A click on an option is the Select's to handle, not the wrapper's.
        handleClick: (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
            if ((e.target as HTMLElement).id.includes("option")) return
            setIsFocused(true)
        },
        blur: () => setIsFocused(false),
        labels: { placeholder: t('searchPlaceholder') },
    }
}
