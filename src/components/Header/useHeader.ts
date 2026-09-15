/**
 * Type contract for the mobile Header bar. Header is purely presentational
 * (no runtime logic), so this file holds only its props interface.
 */
export interface HeaderProps {
    title: string
    /** Shows ← arrow on the left. */
    onBack?: () => void
    /** Shows × mark on the right. */
    onClose?: () => void
    /** Extra class on the title — lets a caller override sizing (e.g.
     * WhatsThis's title is 18px in Figma vs this bar's 17px default). */
    titleClassName?: string
}
