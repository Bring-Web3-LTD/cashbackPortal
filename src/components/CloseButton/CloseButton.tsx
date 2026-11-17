import { trackClose } from '../../utils/rhAnalytics'
import styles from './CloseButton.module.css'

// Every close click reports a funnel `close` event.
// `variant="label"` renders the design's "✕ CLOSE" text button instead of the
// bare boxed icon.
export default function CloseButton({
  onClick,
  ariaLabel,
  labelText,
  variant = 'icon',
}: {
  onClick: () => void
  ariaLabel: string
  labelText?: string
  variant?: 'icon' | 'label'
}) {
  const close = () => {
    trackClose('xButton')
    onClick()
  }
  const cross = <span className={styles.cross} aria-hidden="true" />
  if (variant === 'label') {
    return (
      <button
        type="button"
        className={styles.closeLabel}
        onClick={close}
        aria-label={ariaLabel}
      >
        {cross}
        <span className={styles.labelText}>{labelText}</span>
      </button>
    )
  }
  return (
    <button
      type="button"
      className={styles.close}
      onClick={close}
      aria-label={ariaLabel}
    >
      {cross}
    </button>
  )
}
