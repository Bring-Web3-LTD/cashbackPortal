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
}
