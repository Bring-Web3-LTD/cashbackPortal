import styles from './styles.module.css'
import { MouseEvent, ReactNode, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
    children: ReactNode
    open: boolean
    closeFn: () => void
}

const Popup = ({ children, open, closeFn }: Props) => {

    const handleOverlayClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            closeFn();
        }
    }, [closeFn]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                closeFn();
            }
        };

        if (open) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, closeFn]);

    return (
        <AnimatePresence>
            {open && (
                <div className={styles.overlay} onClick={handleOverlayClick}>
                    <motion.div
                        initial={{ opacity: 0, y: 200, scale: 0.7 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 200, scale: 0.7 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className={styles.popup}
                    >
                        <button
                            className={styles.close_btn}
                            onClick={closeFn}
                        >
                            <img
                                width={20}
                                height={20}
                                src="icons/x-mark.svg"
                                alt="x-mark"
                            />
                        </button>
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

export default Popup