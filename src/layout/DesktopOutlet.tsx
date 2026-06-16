/**
 * Desktop route outlet: framer-motion fade wrapper around the routed page.
 * Pure UI — the shared providers live in Layout; only the outlet is split
 * per platform.
 */
import { motion } from 'framer-motion'
import { Outlet } from 'react-router-dom'

interface Props {
    pathname: string
}

const DesktopOutlet = ({ pathname }: Props) => (
    <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
    >
        <Outlet />
    </motion.div>
)

export default DesktopOutlet
