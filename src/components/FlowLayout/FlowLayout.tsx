import CloseButton from '../CloseButton/CloseButton'
import styles from './FlowLayout.module.css'

export default function FlowLayout({
  onBack,
  onClose,
  backLabel,
  closeLabel,
  children,
}: {
  /** Omitted on steps with nothing to go back to: X only */
  onBack?: () => void
  onClose: () => void
  backLabel: string
  closeLabel: string
  children: React.ReactNode
}) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        {onBack && (
          <button type="button" className={styles.back} onClick={onBack} aria-label={backLabel}>
            <span className={styles.backIcon} aria-hidden="true" />
            <span className={styles.backText}>{backLabel}</span>
          </button>
        )}
        <CloseButton onClick={onClose} ariaLabel={closeLabel} />
      </header>
      <div className={styles.content}>{children}</div>
    </main>
  )
}
