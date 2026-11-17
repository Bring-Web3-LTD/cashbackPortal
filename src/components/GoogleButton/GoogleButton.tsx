import Icon from '../Icon/Icon'
import styles from './GoogleButton.module.css'

// The portal's own "Sign in with Google" button, as in the pair-wallet flow:
// Google's branding guidelines fix the fill, border, radius and type, so it is
// not themed. Google renders nothing here; the click opens its OAuth popup
// (utils/google.ts) and hands back a one-time authorization code for the
// backend to exchange.
export default function GoogleButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      id="sign-in-google-btn"
      type="button"
      className={styles.google}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className={styles.google_logo} name="google.svg" alt="" />
      <span className={styles.google_label}>{label}</span>
    </button>
  )
}
