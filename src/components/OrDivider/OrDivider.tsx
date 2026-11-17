import styles from './OrDivider.module.css'

// The rule between the Google button and the email field. The word carries the
// meaning (two ways to sign up), so it stays readable to assistive tech; only
// the rules either side are decorative.
export default function OrDivider({ label }: { label: string }) {
  return (
    <div className={styles.divider}>
      <span className={styles.line} aria-hidden="true" />
      {label}
      <span className={styles.line} aria-hidden="true" />
    </div>
  )
}
