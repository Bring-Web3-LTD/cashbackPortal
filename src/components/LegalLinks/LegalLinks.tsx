import styles from './LegalLinks.module.css'

// The under-button legal note. The design links only the Terms of Use.
export default function LegalLinks({
  text,
  linkText,
  href,
}: {
  text: string
  linkText: string
  href: string
}) {
  return (
    <p className={styles.legal}>
      {text}{' '}
      <a href={href} target="_blank" rel="noreferrer">
        {linkText}
      </a>
    </p>
  )
}
