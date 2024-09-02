import styles from './styles.module.css';
// Components
import Modal from '../../Modal/Modal';
import CountDown from '../../Countdown/Countdown';
// Hooks
import { ComponentProps, useEffect, useState } from "react";
import { useRouteLoaderData } from 'react-router-dom';
// Functions
import claimInitiate from '../../../api/claim/initiate';
import message from '../../../utils/message';

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    eligibleTokenAmount: string
    currentCryptoSymbol: string
}

// enum STEPS {
//     SIGN_MESSAGE = 'sign_message'
// }

const RewardsModal = ({ open, closeFn, eligibleTokenAmount, currentCryptoSymbol }: Props): JSX.Element => {
    const { platform, walletAddress } = useRouteLoaderData('root') as LoaderData

    // const [step, setStep] = useState(STEPS.SIGN_MESSAGE)
    const [loading, setLoading] = useState(false)
    const [countDown, setCountDown] = useState(false)

    useEffect(() => {
        // Define the message handler
        const handleMessage = (event: MessageEvent) => {
            if (event.data.from !== 'bringweb3' || event.origin === window.location.origin) {
                return; // Ignore messages from untrusted origins
            }
            console.log('Received message:', event);
            // Handle the message data here
        };

        // Set up the event listener
        window.addEventListener('message', handleMessage);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const signMessage = async () => {
        setLoading(true)
        const res = await claimInitiate({
            platform,
            walletAddress,
            targetWalletAddress: walletAddress,
            tokenSymbol: currentCryptoSymbol,
            tokenAmount: 5,
        })

        const messageToSign = res?.messageToSign

        if (!messageToSign) {
            setLoading(false)
            return
        }

        message({ messageToSign })
        setCountDown(true)
    }

    return (
        <Modal
            open={open}
            closeFn={closeFn}
        >
            <div className={styles.modal}>
                <div className={styles.title}>Claim to your wallet</div>
                <div className={styles.claim_amount}>{eligibleTokenAmount} {currentCryptoSymbol}</div>
                <div className={styles.details}>
                    <div className={styles.wallet_address_title}>Wallet address</div>
                    <div className={styles.wallet_address}>{walletAddress}</div>
                    <p className={styles.disclaimer}>
                        By proceeding you acknowledge that we are not liable for any token loss during this onboarding process
                    </p>
                </div>
                <img
                    src="icons/claim.svg"
                    className={styles.modal_img}
                    alt="claim icon"
                />
                <div className={styles.sml_text}>Click "Sign now" and sign the message received on your wallet</div>
                {countDown ?
                    <CountDown
                        isRunning={countDown}
                        setIsRunning={setCountDown}
                    />
                    :
                    <button
                        className={`${styles.sign_btn} ${loading ? styles.disabled : ''}`}
                        disabled={loading}
                        onClick={signMessage}
                    >
                        Sign now
                    </button>
                }
            </div>
        </Modal>
    )
}

export default RewardsModal;