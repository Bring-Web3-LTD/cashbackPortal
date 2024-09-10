import styles from './styles.module.css'
import { MouseEvent, ReactNode, useCallback, useEffect } from "react"
import { useRouteLoaderData } from 'react-router-dom'


interface Props {
    children: ReactNode
    open: boolean
    closeFn: () => void
}

const Modal = ({ children, open, closeFn }: Props) => {
    const { platform } = useRouteLoaderData('root') as LoaderData

    const closePopup = useCallback(() => {
        closeFn()
        window.parent.postMessage({ action: 'CLOSE_POPUP' }, '*')
    }, [closeFn])

    const handleOverlayClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            closePopup();
        }
    }, [closePopup]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                closePopup();
            }
        };

        if (open) {
            window.parent.postMessage({ action: 'OPEN_POPUP' }, '*')
            document.body.classList.add('no_scroll');
            document.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.classList.remove('no_scroll');
        }

        return () => {
            document.body.classList.remove('no_scroll');
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, closePopup]);

    if (!open) return null

    return (
        <div
            className={styles.overlay}
            onClick={handleOverlayClick}
        >
            <div className={styles.modal}>
                <button
                    className={styles.close_btn}
                    onClick={closePopup}
                >
                    <img
                        width={20}
                        height={20}
                        src={`icons/${platform.toUpperCase()}/x-mark.svg`}
                        alt="x-mark"
                    />
                </button>
                {children}
            </div>
        </div>
    )
}

export default Modal