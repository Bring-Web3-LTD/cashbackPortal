/**
 * TEMPORARY — dev-only screen picker for the Pair Wallet flow, so every state
 * can be held against its Figma frame without walking the real flow (which
 * needs a registered email, a live OTP and a wallet signature).
 *
 * Never rendered on a production build. Collapses to a single dot so the
 * design underneath can be compared unobstructed.
 *
 * Delete this file, the `DEV_SCREENS` / `devJump` block in
 * usePairWalletModal.ts, and the two lines rendering it in
 * PairWalletModal.mobile.tsx once the pairing designs are signed off.
 */
import { useState, CSSProperties } from 'react'
import { ENV } from '../../config'
import { DEV_SCREENS, DevScreen } from './usePairWalletModal'

const bar: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 3,
    padding: 3,
    background: 'rgba(0, 0, 0, 0.88)',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 10,
}

const chip: CSSProperties = {
    padding: '2px 5px',
    border: '1px solid #555',
    borderRadius: 3,
    background: '#1b1b1b',
    color: '#eee',
    fontSize: 10,
    lineHeight: '13px',
    cursor: 'pointer',
}

const dot: CSSProperties = {
    ...chip,
    position: 'fixed',
    top: 2,
    left: 2,
    zIndex: 9999,
    opacity: 0.55,
}

const DevStepPicker = ({ onJump }: { onJump: (name: DevScreen) => void }) => {
    const [open, setOpen] = useState(true)

    if (ENV === 'prod') return null

    if (!open) {
        return (
            <button type="button" style={dot} onClick={() => setOpen(true)}>
                dev
            </button>
        )
    }

    return (
        <div style={bar}>
            {DEV_SCREENS.map(([name, label, node]) => (
                <button
                    key={name}
                    type="button"
                    style={chip}
                    title={`Figma ${node}`}
                    onClick={() => onJump(name)}
                >
                    {label}
                </button>
            ))}
            <button
                type="button"
                style={{ ...chip, marginLeft: 'auto' }}
                onClick={() => setOpen(false)}
                title="Hide — the bar covers the sheet header"
            >
                ×
            </button>
        </div>
    )
}

export default DevStepPicker
