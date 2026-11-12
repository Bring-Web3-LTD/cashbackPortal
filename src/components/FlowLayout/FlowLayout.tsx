import styles from './FlowLayout.module.css'

export default function FlowLayout({
  onBack,
  backLabel,
  children,
}: {
  /** Omitted on steps with nothing to go back to: the header stays empty */
  onBack?: () => void
  backLabel: string
  children: React.ReactNode
}) {
  return (
    <main className={styles.page}>
      {/* Rendered even when empty: its fixed height keeps the form at the
          same spot on every step */}
      <div className={styles.header}>
        {onBack && (
          <button type="button" className={styles.back} onClick={onBack} aria-label={backLabel}>
            <span className={styles.backIcon} aria-hidden="true" />
            <span className={styles.backText}>{backLabel}</span>
          </button>
        )}
      </div>
      <div className={styles.content}>{children}</div>
    </main>
  )
}
