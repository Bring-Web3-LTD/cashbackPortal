/**
 * Logic hook for the HistoryItem row. Owns the image-fallback state and derives
 * the ids / expandable flag / click guard so the view is pure UI.
 */
import { useState } from 'react'
import { MobileHistoryRow } from '../../mobile/hooks/useHistory'

export interface HistoryItemProps {
    row: MobileHistoryRow
    isOpen: boolean
    onToggle: () => void
}

export const useHistoryItem = ({ row, onToggle }: HistoryItemProps) => {
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
