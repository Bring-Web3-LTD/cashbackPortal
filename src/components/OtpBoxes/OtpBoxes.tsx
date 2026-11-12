import { useRef } from 'react'
import styles from './OtpBoxes.module.css'

export default function OtpBoxes({
  digits,
  onChange,
  hasError,
  digitLabel,
}: {
  digits: string[]
  onChange: (digits: string[]) => void
  hasError: boolean
  /** Accessible name of box `i` (0-based), e.g. "Digit 1" */
  digitLabel: (i: number) => string
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const len = digits.length

  const handleInput = (i: number, raw: string) => {
    const typed = raw.replace(/\D/g, '')
    const next = digits.slice()
    if (!typed) {
      next[i] = ''
      onChange(next)
      return
    }
    // Support typing and pasting several digits at once
    let j = i
    for (const ch of typed) {
      if (j >= len) break
      next[j++] = ch
    }
    onChange(next)
    refs.current[Math.min(j, len - 1)]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const boxClass = (d: string) =>
    [styles.box, d && styles.filled, hasError && styles.error]
      .filter(Boolean)
      .join(' ')

  return (
    <div className={styles.row}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          className={boxClass(d)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={len}
          value={d}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={digitLabel(i)}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}
