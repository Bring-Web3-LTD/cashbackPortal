/**
 * Inline search bar with autocomplete combobox. Replaces MobileCategories
 * while active. Pure UI — all state/logic lives in useMobileSearchBar.
 */
import Icon from '../../../components/Icon/Icon'
import { useMobileSearchBar, MobileSearchBarProps } from '../../hooks/useMobileSearchBar'
import styles from './styles.module.css'

export type { MobileSearchSuggestion } from '../../hooks/useMobileSearchBar'

const MobileSearchBar = (props: MobileSearchBarProps) => {
    const {
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
    } = useMobileSearchBar(props)

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
                    aria-activedescendant={activeDescendant}
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
