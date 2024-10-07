import styles from './styles.module.css'
import { MouseEvent, ReactNode, useCallback, useEffect } from "react"
import { useRouteLoaderData } from 'react-router-dom'
import message from '../../utils/message'


interface Props {
    children: ReactNode
    open: boolean
    closeFn: () => void
}

const Modal = ({ children, open, closeFn }: Props) => {
    const { iconsPath } = useRouteLoaderData('root') as LoaderData

    const closePopup = useCallback(() => {
        closeFn()
        message({ action: 'CLOSE_POPUP' })
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

        const handleMessage = (event: MessageEvent) => {
            if (event.data.action === 'CLOSE_POPUP') {
                closePopup();
            }
        };

        if (open) {
            const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--modal-overlay-bg')
            window.parent.postMessage({ action: 'OPEN_POPUP', bgColor }, '*')
            document.body.classList.add('no_scroll');
            document.addEventListener('keydown', handleKeyDown);
            window.addEventListener('message', handleMessage);
        }
        return () => {
            document.body.classList.remove('no_scroll');
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('message', handleMessage);
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
                        src={`${iconsPath}/x-mark.svg`}
                        alt="x-mark"
                    />
                </button>
                {children}
            </div>
        </div>
    )
}

export default Modal