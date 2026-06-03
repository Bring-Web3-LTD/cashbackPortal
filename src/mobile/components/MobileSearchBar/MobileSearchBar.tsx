/**
 * Inline search bar with autocomplete combobox. Replaces MobileCategories
 * while active.
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
import Icon from '../../../components/Icon/Icon'
import styles from './styles.module.css'

export interface MobileSearchSuggestion {
    id: string
    name: string
}

interface Props {
    value: string
    onChange: (value: string) => void
    onClose: () => void
    suggestions?: MobileSearchSuggestion[]
    onSelectSuggestion?: (name: string) => void
    showNoResults?: boolean
    showDropdown?: boolean
}

const MobileSearchBar = ({
    value,
    onChange,
    onClose,
    suggestions = [],
    onSelectSuggestion,
    showNoResults = false,
    showDropdown = false,
}: Props) => {
    const { t } = useTranslation()
    const inputRef = useRef<HTMLInputElement>(null)
    const listboxId = useId()

    // -1 = no row highlighted; Enter then commits suggestions[0] or value.
    const [activeIndex, setActiveIndex] = useState(-1)

    useEffect(() => setActiveIndex(-1), [suggestions])
    useEffect(() => inputRef.current?.focus(), [])

    const optionId = useCallback(
        (id: string) => `${listboxId}-opt-${id}`,
        [listboxId],
    )

    const commit = useCallback(
        (name: string) => {
            const trimmed = name.trim()
            if (!trimmed) return
            onSelectSuggestion?.(trimmed)
        },
        [onSelectSuggestion],
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

    return (
        <div className={styles.wrapper}>
            <form className={styles.root} role="search" onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    className={styles.input}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('searchPlaceholder')}
                    aria-label={t('search')}
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                    aria-controls={showDropdown ? listboxId : undefined}
                    aria-activedescendant={
                        activeIndex >= 0 ? optionId(suggestions[activeIndex].id) : undefined
                    }
                />
                <button
                    type="submit"
                    className={styles.iconBtn}
                    onClick={handleIconClick}
                    aria-label={t('search')}
                >
                    <Icon
                        name="magnifying-glass.svg"
                        className={`${styles.iconBtnIcon} ${styles.iconBtnIconDefault}`}
                    />
                    <Icon
                        name="magnifying-glass-active.svg"
                        className={`${styles.iconBtnIcon} ${styles.iconBtnIconActive}`}
                    />
                </button>
            </form>

            {showDropdown && (
                <div id={listboxId} className={styles.dropdown} role="listbox">
                    {showNoResults ? (
                        <div className={styles.empty}>{t('searchNoMatches')}</div>
                    ) : (
                        suggestions.map((s, i) => (
                            <button
                                type="button"
                                key={s.id}
                                id={optionId(s.id)}
                                role="option"
                                aria-selected={i === activeIndex}
                                className={`${styles.suggestion} ${
                                    i === activeIndex ? styles.suggestionActive : ''
                                }`}
                                // mouseDown (not click) so the input keeps focus.
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    commit(s.name)
                                }}
                            >
                                {s.name}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default MobileSearchBar
