import styles from './styles.module.css'
import { MouseEvent, ReactNode, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from 'framer-motion'


interface Props {
    children: ReactNode
    open: boolean
    closeFn: () => void
}

const Modal = ({ children, open, closeFn }: Props) => {

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
            document.body.classList.add('no_scroll');
            document.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.classList.remove('no_scroll');
        }

        return () => {
            document.body.classList.remove('no_scroll');
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, closeFn]);


    return (
        <AnimatePresence>
            {open && (
                <div className={styles.overlay} onClick={handleOverlayClick}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className={styles.modal}
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

export default Modal