/**
 * Desktop route outlet. The shared providers live in Layout; only the outlet
 * is split per platform.
 *
 * The header sits here rather than inside each page: it is the same bar on
 * every route, and rendering it per page meant a navigation threw it away and
 * built a new one, which reloaded the hub's wallet mark and read as a blink.
 * It also needs a full-height parent to stick against, so it stays a direct
 * child of .root.
 *
 * Only the page below it is keyed on the path, so a route change still
 * remounts the page. No transition: the fade it used to carry ran 0→1 over the
 * whole UI — header and dashboard included — which read as a blink on each
 * navigation rather than as a transition.
 */
import { Outlet } from 'react-router-dom'
import Header from '../components/Header/Header'
import styles from './DesktopOutlet.module.css'

interface Props {
    pathname: string
}

const DesktopOutlet = ({ pathname }: Props) => (
    <div className={styles.root}>
        <Header />
        <div key={pathname} className={styles.page}>
            <Outlet />
        </div>
    </div>
)

export default DesktopOutlet
