import styles from './styles.module.css'
// hooks
import { Fragment } from "react"

// components
import Select, {
    components,
    StylesConfig,
    ControlProps,
    NoticeProps,
    SingleValueProps,
} from "react-select"
import { useTranslation } from 'react-i18next'
import Icon from '../Icon/Icon'
import { useSearchDesktop } from './useSearchDesktop'

interface Props {
    options: ReactSelectOptionType[]
    value: ReactSelectOptionType | null
    onChangeFn: (value: ReactSelectOptionType) => void
}

const optionRowStyle = {
    display: "flex",
    alignItems: "center",
    // The list is a flex column with a max height: without this the rows shrink
    // to fit once there are enough of them, instead of keeping 33 and scrolling.
    flexShrink: 0,
    fontWeight: "var(--search-option-f-w, var(--search-f-w, 400))",
    fontSize: "var(--search-option-f-s, 14px)",
    lineHeight: "var(--search-option-l-h, 20px)",
    height: "33px",
    color: "var(--search-option-f-c)",
    padding: "0 20px 0 39px",
} as const

const singleOptionRowStyle = {
    fontWeight: "var(--search-single-option-f-w, 500)",
    fontSize: "var(--search-single-option-f-s, 15px)",
    lineHeight: "var(--search-single-option-l-h, 22px)",
    height: "42px",
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
        boxSizing: "border-box",
        width: "100%",
        height: "46px",
        padding: "11px 14px",
        fontSize: "var(--search-f-s)",
        fontWeight: "var(--search-f-w)",
        lineHeight: "var(--search-l-h, 24px)",
        cursor: "text",
        boxShadow: "none",
        outline: "none !important",
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
        marginTop: "4px",
        backgroundColor: "var(--search-menu-bg, var(--search-bg))",
        border: "var(--search-menu-border-w, 1px) solid var(--search-menu-border-c, transparent)",
        boxShadow: "var(--search-menu-shadow, 0 8px 24px rgba(0, 0, 0, 0.4))",
        borderRadius: "var(--search-menu-radius, 10px)",
        overflow: "hidden",
        paddingTop: "8px",
        paddingBottom: "8px",
        fontSize: "var(--search-f-s)",
        zIndex: 10,
    }),
    option: (base, state) => {
        const isSingleOption = (state.selectProps.options?.length ?? 0) <= 1
        return {
            ...base,
            ...optionRowStyle,
            ...(isSingleOption ? singleOptionRowStyle : {}),
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
        margin: 0,
        padding: 0,
    }),
    placeholder: (base) => ({
        ...base,
        color: 'var(--search-placeholder-f-c)',
        margin: 0,
    }),
    singleValue: (base) => ({
        ...base,
        color: 'var(--search-f-c)',
        margin: 0,
    }),
    valueContainer: (base) => ({
        ...base,
        padding: 0,
        // The 8px belongs between the glyph and the text only. A gap on the
        // control would also land after the text, since react-select still
        // renders an empty indicators container as the last flex child.
        marginLeft: "8px",
    }),
    noOptionsMessage: (base) => ({
        ...base,
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        padding: "12px 14px",
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
    const { t } = useTranslation()

    if (props.selectProps.inputValue.length <= 1) {
        return null
    }

    return (
        <components.NoOptionsMessage {...props}>
            <div className={styles.no_results_title}>
                {t('searchNoResults')}
            </div>
            <div className={styles.no_results_hint}>
                {t('searchNoResultsHint')}
            </div>
        </components.NoOptionsMessage>
    )
}

const CustomControl = (props: ControlProps<ReactSelectOptionType>) => {
    // `hasValue` keeps the active glyph after blur, while a term is still
    // filtering. Platforms with no focus icon fall back to the plain one.
    const isActive = props.isFocused || props.selectProps.menuIsOpen || props.hasValue
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
    const {
        id,
        selectRef,
        filteredOptions,
        isMenuOpen,
        isFocused,
        handleChange,
        handleInputChange,
        handleClick,
        blur,
        labels,
    } = useSearchDesktop({ options, onChangeFn })

    return (
        <div
            id="search-container"
            onClick={handleClick}
            className={styles.search}>
            <Select
                id="search-select"
                ref={selectRef}
                instanceId={id}
                placeholder={labels.placeholder}
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
                onBlur={blur}
            />
        </div>
    )
}

export default Search