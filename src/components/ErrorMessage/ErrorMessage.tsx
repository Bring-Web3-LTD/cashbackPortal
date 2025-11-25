import { DEV_MODE } from '../../config'
import styles from './styles.module.css'
import { useRouteError } from "react-router-dom"

const ErrorMessage = () => {
    const error = useRouteError() as { message: string, stack: string }

    return (
        <div id="error-message-container" className={styles.container}>
            <div id="error-message" className={styles.message}>
                {DEV_MODE ?
                    <div>
                        {error.message}
                        <br />
                        {error.stack}
                    </div>
                    :
                    <div>Something went wrong.<br />Please try again later</div>
                }
            </div>
        </div>
    )
}

export default ErrorMessage