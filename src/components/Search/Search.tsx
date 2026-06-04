import styles from './styles.module.css'
// hooks
import { Fragment, MouseEvent, useEffect, useId, useRef, useState } from "react"

// components
import Select, {
    components,
    StylesConfig,
    SingleValue,
    MultiValue,
    ControlProps,
    NoticeProps,
    SingleValueProps,
    SelectInstance,
} from "react-select"
import { useGoogleAnalytics } from '../../utils/hooks/useGoogleAnalytics'
import { useTranslation } from 'react-i18next'
import { useDebounce } from 'use-debounce'
import Icon from '../Icon/Icon'

interface Props {
    options: ReactSelectOptionType[]
    value: ReactSelectOptionType | null
    onChangeFn: (value: ReactSelectOptionType) => void
}

const optionRowStyle = {
    fontWeight: "var(--search-option-f-w, var(--search-f-w, 400))",
    fontSize: "var(--search-option-f-s, 15px)",
    lineHeight: "22px",
    height: "33px",
    color: "var(--search-option-f-c)",
    padding: "5px 20px 5px 39px",
} as const

const customStyles: StylesConfig<ReactSelectOptionType> = {
    control: (base, state) => {
        const borderColor = state.isFocused
            ? "var(--search-border-focus-c, var(--search-border-c))"
            : "var(--search-border-c)"
        return {
        ...base,
        border: `var(--search-border-w) solid ${borderColor}`,
        borderRadius: "var(--search-radius, 10px)",
        alignContent: "center",
        "&:hover": {
            border: `var(--search-border-w) solid ${borderColor}`,
        },
        backgroundColor: "var(--search-bg)",
        width: "438px",
        height: "46px",
        padding: "8px 8px 8px 17px",
        gap: "6px",
        fontSize: "var(--search-f-s)",
        fontWeight: "var(--search-f-w)",
        cursor: "text",
        boxShadow: "none",
        outline: "none !important",
        "@media only screen and (max-width: 1280px)": {
            width: "342px",
        }
        }
    },
    menuList: (base) => ({
        ...base,
        paddingTop: 0,
        paddingBottom: 0,
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        scrollbarWidth: "none",
        "::-webkit-scrollbar": {
            display: "none",
        },
    }),
    menu: (base) => ({
        ...base,
        marginTop: "6px",
        backgroundColor: "var(--search-menu-bg, var(--search-bg))",
        border: "var(--search-menu-border-w, 0) solid var(--search-menu-border-c, transparent)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
        borderRadius: "var(--search-menu-radius, 12px)",
        overflow: "hidden",
        paddingTop: "10px",
        paddingBottom: "15px",
        fontSize: "var(--search-f-s)",
        zIndex: 10,
    }),
    option: (base, state) => {
        const isSingleOption = (state.selectProps.options?.length ?? 0) <= 1
        return {
            ...base,
            ...optionRowStyle,
            backgroundColor: isSingleOption
                ? "transparent"
                : state.isFocused
                    ? "var(--search-option-hover-bg)"
                    : state.isSelected
                        ? "var(--search-menu-bg, var(--search-bg))"
                        : "transparent",
            "&:hover": { backgroundColor: isSingleOption ? "transparent" : "var(--search-option-hover-bg)" },
            "&:active": { backgroundColor: isSingleOption ? "transparent" : "var(--search-option-hover-bg)" },
            cursor: "pointer",
        }
    },
    input: (base) => ({
        ...base,
        "input[type='text']:focus": { boxShadow: "none" },
        color: "var(--search-f-c)",
    }),
    placeholder: (base) => ({
        ...base,
        color: 'var(--search-placeholder-f-c)'
    }),
    singleValue: (base) => ({
        ...base,
        color: 'var(--search-f-c)',
    }),
    valueContainer: (base) => ({
        ...base,
        padding: 0,
    }),
    noOptionsMessage: (base) => ({
        ...base,
        padding: "5px 20px 5px 39px",
        textAlign: "left",
        color: "var(--search-option-f-c)",
    }),
}

const CustomSingleValue = (
    props: SingleValueProps<ReactSelectOptionType> & { isFocused: boolean },
) => {
    const { children, ...rest } = props
    const { selectProps, isFocused } = props
    if (selectProps.menuIsOpen || isFocused) return <Fragment></Fragment>
    return <components.SingleValue {...rest}>{children}</components.SingleValue>
}

const CustomNoOptionsMessage = (props: NoticeProps<ReactSelectOptionType>) => {
    if (props.selectProps.inputValue.length <= 1) {
        return null
    }

    return (
        <components.NoOptionsMessage {...props}>
            <div style={{ fontSize: 15, fontWeight: 500, lineHeight: "24px", color: "var(--search-option-f-c)" }}>
                No results.
            </div>
            <div style={{ fontSize: 14, fontWeight: 400, lineHeight: "16px", color: "var(--search-option-f-c)" }}>
                Try a different search term
            </div>
        </components.NoOptionsMessage>
    )
}

const CustomControl = (props: ControlProps<ReactSelectOptionType>) => {
    const isActive = props.isFocused || props.selectProps.menuIsOpen
    return (
        <components.Control {...props}>
            <Icon
                height={24}
                width={24}
                name={isActive ? "magnifying-glass-focus.svg" : "magnifying-glass.svg"}
                fallbackName="magnifying-glass.svg"
                alt="magnifying-glass-icon"
            />
            {props.children}
        </components.Control>
    )
}

const Search = ({ options, value, onChangeFn }: Props): JSX.Element => {
    const id = useId()
    const [input, setInput] = useState('')
    const [debouncedInput] = useDebounce(input, 500)
    const [filteredOptions, setFilteredOptions] = useState<ReactSelectOptionType[]>(options)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const selectRef = useRef<SelectInstance<ReactSelectOptionType> | null>(null)
    const { sendGaEvent } = useGoogleAnalytics()
    const { t } = useTranslation()

    useEffect(() => {
        if (!debouncedInput.length) return
        sendGaEvent("search_input", {
            category: "user_action",
            action: "input",
            details: debouncedInput,
            hasResults: !!filteredOptions.length,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedInput])

    const handleChange = (
        item:
            | SingleValue<ReactSelectOptionType>
            | MultiValue<ReactSelectOptionType>
            | null,
    ) => {
        if (!item || Array.isArray(item)) return
        const { value } = item as ReactSelectOptionType

        sendGaEvent("search_select", {
            category: "user_action",
            action: "select",
            details: value,
        })

        onChangeFn({ value, label: value })
        // Blurring fires the Select's onBlur, which sets isFocused(false) –
        // keep focus state driven by a single source (the blur event).
        selectRef.current?.blur()
    }

    const handleInputChange = (inputValue: string) => {
        setInput(inputValue)
        // eslint-disable-next-line no-unsafe-optional-chaining
        if (!inputValue || (inputValue?.trim()).length < 2) {
            if (isMenuOpen) setIsMenuOpen(false)
            if (filteredOptions.length) {
                setFilteredOptions([])
            }
        } else {
            const input = inputValue.trimStart().toLowerCase()
            if (!isMenuOpen && input.length > 1) setIsMenuOpen(true)

            // if (input.length === 3) {
            //     sendGaEvent("search_input", {
            //         category: "user_action",
            //         action: "input",
            //         details: input,
            //     })
            // }
            let filtered: ReactSelectOptionType[] = []
            const notFirstWordMatches: ReactSelectOptionType[] = []
            if (options?.length) {
                options.forEach((e) => {
                    if (e.label.toLowerCase().startsWith(input)) {
                        filtered.push(e)
                    } else if (
                        e.label.includes(" ") &&
                        !e.label.toLowerCase().startsWith(input)
                    ) {
                        const words = e.label.toLowerCase().split(/\s+/)
                        if (words.some((word: string) => word.startsWith(input))) {
                            notFirstWordMatches.push(e)
                        }
                    }
                })
                if (notFirstWordMatches.length) {
                    filtered = filtered.concat(notFirstWordMatches)
                }
            }
            setFilteredOptions(filtered)
        }
    }

    const handleClick = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
        const target = e.target as HTMLElement

        if (target.id.includes("option")) return;
        setIsFocused(true)
    }

    return (
        <div
            id="search-container"
            onClick={e => handleClick(e)}
            className={styles.search}>
            <Select
                id="search-select"
                ref={selectRef}
                instanceId={id}
                placeholder={t('searchPlaceholder')}
                styles={customStyles}
                components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                    Control: CustomControl,
                    NoOptionsMessage: CustomNoOptionsMessage,
                    SingleValue: (props) => CustomSingleValue({ ...props, isFocused }),
                }}
                isMulti={false}
                menuIsOpen={isMenuOpen}
                options={filteredOptions}
                onChange={handleChange}
                onInputChange={handleInputChange}
                value={value}
                onBlur={() => setIsFocused(false)}
            />
        </div>
    )
}

export default Search