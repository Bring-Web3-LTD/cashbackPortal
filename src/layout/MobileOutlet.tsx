/**
 * Mobile route outlet: framer-motion fade wrapper around the routed page,
 * inside the width-capped `.root` container. Pure UI — the shared providers
 * live in Layout; only the outlet is split per platform.
 */
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import styles from './MobileOutlet.module.css'

interface Props {
    pathname: string
}

/** Scopes the module's :global scrollbar rules to the mobile tree. */
const useMobileBodyClass = () => {
    useEffect(() => {
        document.body.classList.add('mobile-portal')
        return () => document.body.classList.remove('mobile-portal')
    }, [])
}

const MobileOutletView = ({ pathname }: Props) => (
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

const MobileOutlet = (props: Props) => {
    useMobileBodyClass()
    return <MobileOutletView {...props} />
}

export default MobileOutlet
