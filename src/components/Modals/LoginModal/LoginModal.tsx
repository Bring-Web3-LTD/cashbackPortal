import styles from './styles.module.css'
import Modal from '../../Modal/Modal'
import { ComponentProps } from 'react'
import message from '../../../utils/message'

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    backgroundColor?: string | undefined,
}

const LoginModal = ({
    open,
    closeFn
}: Props) => {


    const onClose = () => {
        message({ action: 'POPUP_CLOSED' })
        closeFn()
    }

    const promptLogin = () => {
        message({ action: 'LOGIN' })
        closeFn()
    }

    return (
        <Modal
            open={open}
            closeFn={onClose}
        >
            <div className={styles.modal}>
                <div>
                    To move on please login
                </div>
                <button onClick={promptLogin}>Login</button>
            </div>
        </Modal>
    )
}

export default LoginModal