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
                    {isOpen ? (
                        <svg
                            className={styles.chevronIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M8 3.81445L14.7803 10.5948C15.0732 10.8877 15.0732 11.3625 14.7803 11.6554C14.4874 11.9483 14.0126 11.9483 13.7197 11.6554L8 5.93577L2.28033 11.6554C1.98744 11.9483 1.51256 11.9483 1.21967 11.6554C0.926777 11.3625 0.926777 10.8877 1.21967 10.5948L8 3.81445Z"
                            />
                        </svg>
                    ) : (
                        <svg
                            className={styles.chevronIcon}
                            width="14"
                            height="9"
                            viewBox="0 0 14 9"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M7 8.06055L0.219672 1.28022C-0.0732216 0.987323 -0.0732215 0.51245 0.219672 0.219557C0.512564 -0.0733369 0.987438 -0.0733368 1.28033 0.219557L7 5.93923L12.7197 0.219558C13.0126 -0.0733357 13.4874 -0.0733357 13.7803 0.219558C14.0732 0.512451 14.0732 0.987325 13.7803 1.28022L7 8.06055Z"
                            />
                        </svg>
                    )}
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
