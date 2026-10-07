/**
 * Desktop route outlet. The shared providers live in Layout; only the outlet
 * is split per platform.
 *
 * Keyed on the path so a route change remounts the subtree and the page opens
 * at the top. No transition: the fade it used to carry ran 0→1 over the whole
 * UI — header and dashboard included, since every page renders its own — which
 * read as a blink on each navigation rather than as a transition.
 */
import { Outlet } from 'react-router-dom'
import styles from './DesktopOutlet.module.css'

interface Props {
    pathname: string
}

const DesktopOutlet = ({ pathname }: Props) => (
    <div key={pathname} className={styles.root}>
        <Outlet />
    </div>
)

export default DesktopOutlet
