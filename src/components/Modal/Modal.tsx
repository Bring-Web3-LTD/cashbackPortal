import styles from './styles.module.css'
import { MouseEvent, ReactNode, useCallback, useEffect } from "react"
import { useRouteLoaderData } from 'react-router-dom'
import message from '../../utils/message'


interface Props {
    children: ReactNode
    open: boolean
    style?: { [key: string]: string }
    xMarkPath?: string
    showCloseBtn?: boolean
    closeFn: () => void
}

const Modal = ({ children, style, open, closeFn, xMarkPath = 'x-mark.svg', showCloseBtn = true }: Props) => {
    const { iconsPath } = useRouteLoaderData('root') as LoaderData

    const closePopup = useCallback(() => {
        closeFn()
        message({ action: 'POPUP_CLOSED' })
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
                message({ action: 'POPUP_CLOSED' })
            }
        };

        if (open) {
            const overlayBgColor = getComputedStyle(document.documentElement).getPropertyValue('--modal-overlay-bg')
            message({ action: 'POPUP_OPENED', overlayBgColor })
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
            id="modal-overlay"
            style={style}
            className={styles.overlay}
            onClick={handleOverlayClick}
        >
            <div id="modal-content" className={styles.modal}>
                {showCloseBtn ?
                    <button
                        id="modal-close-btn"
                        className={styles.close_btn}
                        onClick={closePopup}
                    >
                        <img
                            width={20}
                            height={20}
                            src={`${iconsPath}/${xMarkPath}`}
                            alt="x-mark"
                            onError={(e) => {
                                e.currentTarget.src = `${iconsPath}/x-mark.svg`
                            }}
                        />
                    </button> : null}
                {children}
            </div>
        </div>
    )
}

export default Modal