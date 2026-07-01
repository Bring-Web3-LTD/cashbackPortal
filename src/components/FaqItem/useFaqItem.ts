/**
 * Type contract for the FaqItem component. FaqItem is purely presentational
 * (no runtime logic), so this file holds only its prop/shape interfaces.
 */
export interface Link {
    href: string
    linkText: string
}

export interface FaqItemProps {
    id: string
    question: string
    answer: string[]
    links: Link[]
    indentationMark: string
    isOpen: boolean
    onToggle: () => void
}
