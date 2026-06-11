/**
 * Logic hook for MobileHistoryItem. Owns the image-fallback state and derives
 * the ids / expandable flag / click guard so the .tsx is pure UI.
 */
import { useState } from 'react'
import { MobileHistoryRow } from './useHistory'

export interface MobileHistoryItemProps {
    row: MobileHistoryRow
    isOpen: boolean
    onToggle: () => void
}

export const useMobileHistoryItem = ({ row, onToggle }: MobileHistoryItemProps) => {
    const panelId = `mobile-history-panel-${row.id}`
    const buttonId = `mobile-history-btn-${row.id}`
    const [imgFailed, setImgFailed] = useState(false)

    const expandable = row.description.some((d) => d[0] || d[1])

    const handleClick = () => {
        if (expandable) onToggle()
    }

    return {
        panelId,
        buttonId,
        imgFailed,
        onImgError: () => setImgFailed(true),
        expandable,
        handleClick,
    }
}
