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
import { useTranslation } from 'react-i18next';
import claimSubmit from '../../../api/claim/submit';

interface Props extends Omit<ComponentProps<typeof Modal>, 'children'> {
    eligibleTokenAmount: string
    currentCryptoSymbol: string
}

// enum STEPS {
//     SIGN_MESSAGE = 'sign_message'
// }

const RewardsModal = ({ open, closeFn, eligibleTokenAmount, currentCryptoSymbol }: Props): JSX.Element => {
    const { platform, walletAddress, iconsPath } = useRouteLoaderData('root') as LoaderData
    const { t } = useTranslation()

    // const [step, setStep] = useState(STEPS.SIGN_MESSAGE)
    const [loading, setLoading] = useState(false)
    const [countDown, setCountDown] = useState(false)
    const [iconFallback, setIconFallback] = useState(false)

    useEffect(() => {
        // Define the message handler
        const handleMessage = async (event: MessageEvent) => {
            if (event.data.from !== 'bringweb3' || event.origin === window.location.origin) {
                return; // Ignore messages from untrusted origins
            }
            console.log('BRING! Received message:', event);
            // Handle the message data here
            if (event.data.action === 'SIGNATURE') {
                const res = await claimSubmit({
                    walletAddress,
                    targetWalletAddress: walletAddress,
                    tokenSymbol: currentCryptoSymbol,
                    tokenAmount: 13,
                    signature: event.data.signature,
                    key: event.data.key,
                    message: event.data.message,
                    platform
                })
                console.log({ submit: res });

            }
        };

        // Set up the event listener
        window.addEventListener('message', handleMessage);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [currentCryptoSymbol, platform, walletAddress]);

    const signMessage = async () => {
        setLoading(true)
        const res = await claimInitiate({
            platform,
            walletAddress,
            targetWalletAddress: walletAddress,
            tokenSymbol: currentCryptoSymbol,
            tokenAmount: 13,
        })

        const messageToSign = res?.messageToSign

        if (!messageToSign) {
            setLoading(false)
            return
        }

        message({ messageToSign })
        setCountDown(true)
        window.parent.postMessage({ from: 'bringweb3', messageToSign, action: 'SIGN_MESSAGE' }, '*')
    }

    return (
        <Modal
            open={open}
            closeFn={closeFn}
        >
            <div className={styles.modal}>
                <div className={styles.title}>{t('claimToYourWallet')}</div>
                <div className={styles.claim_amount}>{eligibleTokenAmount} {currentCryptoSymbol}</div>
                <div className={styles.details}>
                    <div className={styles.wallet_address_title}>Wallet address</div>
                    <div className={styles.wallet_address}>{walletAddress}</div>
                    <p className={styles.disclaimer}>
                        By proceeding you acknowledge that we are not liable for any token loss during this onboarding process
                    </p>
                </div>
                <div className={styles.modal_img_container}>
                    {
                        iconFallback ?
                            null
                            :
                            <img
                                src={`${iconsPath}/claim.svg`}
                                className={styles.modal_img}
                                alt="claim icon"
                                onError={() => setIconFallback(true)}
                            />
                    }
                </div>
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
                        {t('signNow')}
                    </button>
                }
            </div>
        </Modal>
    )
}

export default RewardsModal;