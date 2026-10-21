/**
 * Mobile route outlet: framer-motion fade wrapper around the routed page,
 * inside the width-capped `.root` container. Pure UI — logic in
 * useMobileOutlet; the shared providers live in Layout, only the outlet is
 * split per platform.
 */
import { motion } from 'framer-motion'
import { Outlet } from 'react-router-dom'
import styles from './MobileOutlet.module.css'
import { useMobileOutlet } from './useMobileOutlet'

interface Props {
    pathname: string
}

const MobileOutlet = ({ pathname }: Props) => {
    useMobileOutlet()

    return (
        <motion.div
            key={pathname}
            className={styles.root}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <Outlet />
        </motion.div>
    )
}

export default MobileOutlet
