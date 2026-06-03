import { parseTokenDisplay } from '../../utils/tokenAmount'
import styles from './styles.module.css'

interface Props {
    value: string | null | undefined
    className?: string
}

/**
 * Renders a token amount display string, converting Unicode subscript
 * digits (U+2080–U+2089) into semantic <sub> elements.
 *
 * Example: "0.0₂12" → 0.0<sub>2</sub>12
 */
const TokenAmount = ({ value, className }: Props) => {
    const parts = parseTokenDisplay(value)

    if (parts.length === 0) return null

    // Fast path — no subscripts.
    if (parts.length === 1 && parts[0].type === 'text') {
        return <span className={className}>{parts[0].content}</span>
    }

    return (
        <span className={className}>
            {parts.map((part, i) =>
                part.type === 'sub'
                    ? <sub key={i} className={styles.sub}>{part.content}</sub>
                    : <span key={i}>{part.content}</span>
            )}
        </span>
    )
}

export default TokenAmount
