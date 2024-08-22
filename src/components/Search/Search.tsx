import styles from './styles.module.css'
// hooks
import { Fragment, useId, useState } from "react"
// import { useAccount } from "wagmi"

// components
import Select, {
    components,
    StylesConfig,
    SingleValue,
    MultiValue,
    ControlProps,
    NoticeProps,
    SingleValueProps,
} from "react-select"

// functions
// import { sendGaEventBring } from "@/utils/bringWeb3/services/googleAnalytics"

interface Props {
    options: ReactSelectOptionType[]
    value: ReactSelectOptionType | null
    onChangeFn: (value: ReactSelectOptionType) => void
}

interface ReactSelectOptionType {
    label: string
    value: string
}

const customStyles: StylesConfig<ReactSelectOptionType> = {
    control: (base) => ({
        ...base,
        border: "1px solid white",
        borderRadius: "10px",
        alignContent: "center",
        "&:hover": { border: "1px solid white" },
        backgroundColor: "var(--bg)",
        color: "rgba(255, 255, 255)",
        width: "438px",
        height: "40px",
        padding: "4px 8px 4px 12px",
        fontSize: "16px",
        cursor: "text",
        boxShadow: "none",
        outline: "none !important",
        "@media only screen and (max-width: 1280px)": {
            // width: "358px",
            width: "342px",
        },
        // "@media only screen and (max-width: 768px)": {
        //   width: "342px",
        // },
    }),
    menuList: (base) => ({
        ...base,
        paddingTop: 0,
        paddingBottom: 0,
        "&:first-of-type": {
            borderTopLeftRadius: "10px",
            borderTopRightRadius: "10px",
        },
        "&:last-child": {
            borderBottomLeftRadius: "10px",
            borderBottomRightRadius: "10px",
        },
        "::-webkit-scrollbar": {
            width: "10px",
        },
        "::-webkit-scrollbar-track": {
            background: "transparent",
        },
        "::-webkit-scrollbar-thumb": {
            background: "rgba(255, 255, 255, 0.40)",
            backgroundClip: "padding-box",
            border: "4px solid rgba(7, 19, 23, 0)",
            borderRadius: "10px",
        },
        "::-webkit-scrollbar-thumb:hover": {
            background: "#555",
        },
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: "#071317",
        color: "rgba(255, 255, 255, 0.60)",
        border: "1.5px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "10px",
        fontSize: "16px",
        zIndex: 10,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused
            ? "rgba(255, 255, 255, 0.3)"
            : state.isSelected
                ? "#071317"
                : base.backgroundColor,
        "&:active": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
        color: "white",
    }),
    input: (base) => ({
        ...base,
        "input[type='text']:focus": { boxShadow: "none" },
        color: "white",
    }),
    singleValue: (base) => ({
        ...base,
        color: "white",
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
            No options
        </components.NoOptionsMessage>
    )
}

const CustomControl = (props: ControlProps<ReactSelectOptionType>) => (
    <components.Control {...props}>
        <img
            height={20}
            width={20}
            src="/icons/magnifying-glass.svg"
            alt="magnifying-glass-icon"
        />
        {props.children}
    </components.Control>
)

const Search = ({ options, value, onChangeFn }: Props): JSX.Element => {
    const id = useId()
    const [filteredOptions, setFilteredOptions] =
        useState<ReactSelectOptionType[]>(options)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [msg, setMsg] = useState("")
    //   const { address } = useAccount()

    const handleChange = (
        item:
            | SingleValue<ReactSelectOptionType>
            | MultiValue<ReactSelectOptionType>
            | null,
    ) => {
        if (!item || Array.isArray(item)) return
        const { value } = item as ReactSelectOptionType

        // const parameters: BringGAEvent = {
        //   platform: "AURORA",
        //   category: "user_action",
        //   action: "select",
        //   details: value,
        // }
        // if (address) parameters.walletAddress = address

        // sendGaEventBring({
        //   name: "search_select",
        //   parameters,
        // })

        onChangeFn({ value, label: value })
        setIsFocused(false)
    }

    const handleInputChange = (inputValue: string) => {
        if (!inputValue || (inputValue?.trim()).length < 2) {
            if ((inputValue?.trim()).length == 1) {
                setMsg("Keep typing...")
            } else if (msg.length) {
                setMsg("")
            }
            if (isMenuOpen) setIsMenuOpen(false)
            if (filteredOptions.length) {
                setFilteredOptions([])
            }
        } else {
            const input = inputValue.trimStart().toLowerCase()
            if (msg.length) setMsg("")
            if (!isMenuOpen && input.length > 1) setIsMenuOpen(true)

            //   if (input.length === 3) {
            //     const parameters: BringGAEvent = {
            //       platform: "AURORA",
            //       category: "user_action",
            //       action: "input",
            //       details: input,
            //     }
            //     if (address) parameters.walletAddress = address

            //     sendGaEventBring({
            //       name: "search_input",
            //       parameters,
            //     })
            //   }
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
                        let words = e.label.toLowerCase().split(/\s+/)
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

    return (
        <div
            onClick={() => {
                setIsFocused(true)
            }}
            className={styles.search}>
            <Select
                instanceId={id}
                placeholder="Brand, product, destination..."
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
                // onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            {msg.length ? (
                <div className={styles.msg}>
                    {msg}
                </div>
            ) : null}
        </div>
    )
}

export default Search