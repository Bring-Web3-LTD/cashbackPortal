import styles from './styles.module.css'
import { useRouteError } from "react-router-dom"

const ErrorMessage = () => {
    const error = useRouteError() as { message: string, stack: string }

    console.log('test', error);


    return (
        <div className={styles.container}>
            <div className={styles.message}>
                {error.message}
            </div>
        </div>
    )
}

export default ErrorMessage