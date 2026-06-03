/**
 * Collapsible FAQ entry. Collapsed: question + chevron. Expanded: grows to
 * show a divider and the answer text. Visuals from CSS vars.
 */
import { FC, JSX } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './styles.module.css'

interface Link {
    href: string
    linkText: string
}

interface Props {
    id: string
    question: string
    answer: string[]
    links: Link[]
    indentationMark: string
    isOpen: boolean
    onToggle: () => void
}

/**
 * Renders the answer lines, turning configured `linkText` occurrences into
 * anchors and indenting lines that begin with `indentationMark`. Mirrors the
 * desktop AnswerParser so both surfaces handle the same backend payload.
 */
const renderAnswer = (
    answer: string[],
    links: Link[],
    indentationMark: string,
): JSX.Element => {
    const parseLine = (text: string): (string | JSX.Element)[] => {
        let result: (string | JSX.Element)[] = [text]
        links.forEach((link, linkIndex) => {
            result = result.flatMap((part) => {
                if (typeof part !== 'string') return part
                return part
                    .split(new RegExp(`(${link.linkText})`, 'i'))
                    .map((subPart, subIndex) =>
                        subPart.toLowerCase() === link.linkText.toLowerCase() ? (
                            <a
                                key={`${linkIndex}-${subIndex}`}
                                className={styles.link}
                                href={link.href}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {subPart}
                            </a>
                        ) : (
                            subPart
                        ),
                    )
            })
        })
        return result
    }

    return (
        <>
            {answer.map((line, index) => (
                <p
                    key={index}
                    className={
                        indentationMark && line.startsWith(indentationMark)
                            ? `${styles.answerLine} ${styles.answerIndented}`
                            : styles.answerLine
                    }
                >
                    {parseLine(line)}
                </p>
            ))}
        </>
    )
}

const MobileFaqItem: FC<Props> = ({
    id,
    question,
    answer,
    links,
    indentationMark,
    isOpen,
    onToggle,
}) => {
    const panelId = `mobile-faq-panel-${id}`
    const buttonId = `mobile-faq-btn-${id}`

    return (
        <div className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}>
            <button
                type="button"
                id={buttonId}
                className={styles.question}
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls={panelId}
            >
                <span className={styles.questionText}>{question}</span>
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                    <svg
                        className={styles.chevronIcon}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className={styles.answer}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <span className={styles.divider} aria-hidden="true" />
                        <div className={styles.answerBody}>
                            {renderAnswer(answer, links, indentationMark)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default MobileFaqItem
