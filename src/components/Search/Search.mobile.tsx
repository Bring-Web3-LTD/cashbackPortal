/**
 * Inline search bar with autocomplete combobox. Replaces the categories row
 * while active. Pure UI — all state/logic lives in useSearch.
 */
import Icon from '../Icon/Icon'
import { useSearch, SearchProps } from './useSearch'
import styles from './styles.mobile.module.css'

export type { SearchSuggestion } from './useSearch'

const Search = (props: SearchProps) => {
    const {
        labels,
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
        showFade,
        handleSubmit,
        handleIconClick,
        handleKeyDown,
    } = useSearch(props)

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
                    placeholder={labels.placeholder}
                    aria-label={labels.search}
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                    aria-controls={showDropdown ? listboxId : undefined}
                    aria-activedescendant={activeDescendant}
                />
                <button
                    type="submit"
                    className={styles.iconBtn}
                    onClick={handleIconClick}
                    aria-label={labels.search}
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
                    <div className={styles.dropdownList}>
                        {showNoResults ? (
                            <div className={styles.empty}>{labels.noMatches}</div>
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
                    {showFade && <span className={styles.dropdownFade} aria-hidden="true" />}
                </div>
            )}
        </div>
    )
}

export default Search
