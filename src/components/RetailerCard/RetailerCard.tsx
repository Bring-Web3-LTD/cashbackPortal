import styles from './styles.module.css'
import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import formatCashback from '../../utils/formatCashback'
import Popup from '../Popup/Popup'
import { useLoaderData } from 'react-router-dom'
import activate from '../../api/activate'

const isBigCashback = (symbol: string, amount: number) => {
    switch (symbol) {
        case "%":
            return amount > 4
        case "$":
            return amount > 10
        default:
            return false
    }
}

interface Props extends Retailer {
    generalTerms: string
    termsUrl: string
    search: ReactSelectOptionType | null
}

const RetailerCard = ({
    id,
    iconPath,
    name,
    section,
    backgroundColor,
    maxCashback,
    cashbackSymbol,
    cashbackCurrency,
    termsUrl,
    generalTerms,
    search,
}: Props) => {
    const { walletAddress, platform, cryptoSymbols } = useLoaderData() as LoaderData
    const [fallbackImg, setFallbackImg] = useState('')
    const [redirectLink, setRedirectLink] = useState('')
    const [popupStatus, setPopupStatus] = useState('close')
    const [terms, setTerms] = useState('')

    const cashback = formatCashback(maxCashback, cashbackSymbol, cashbackCurrency)
    const isBig = isBigCashback(cashbackSymbol, maxCashback)

    const activateDeal = async () => {
        if (!walletAddress) return

        const body: Parameters<typeof activate>[0] = {
            platform,
            itemId: id,
            walletAddress,
            tokenSymbol: cryptoSymbols[0]
        }

        if (search?.value) body['search'] = search.value

        const res = await activate(body)
        setRedirectLink(res.url)
        setPopupStatus('open')
    }

    useEffect(() => {
        if (popupStatus === 'loading') {
            activateDeal()
        }

        if (!termsUrl || terms.length || popupStatus === 'close') return

        fetch(termsUrl)
            .then(res => res.text())
            .then(data => setTerms(data))
    }, [popupStatus])

    return (
        <>
            <div
                className={styles.card}
                onClick={() => setPopupStatus('loading')}
            >
                {isBig ? <div className={styles.flag}>{cashback}</div> : null}
                <div
                    className={styles.logo_container}
                    style={{ backgroundColor: backgroundColor || 'white' }}
                >
                    {fallbackImg ?
                        <div className={styles.fallback_img}>{fallbackImg}</div>
                        :
                        <img
                            className={styles.logo}
                            loading='eager'
                            src={iconPath}
                            alt={`${name} logo`}
                            onError={() => setFallbackImg(name)}
                        />
                    }
                </div>
                <div className={styles.retailer_name}>{section ? `/${section}` : name}</div>
                <div className={styles.cashback_rate}>Up to {cashback} cashback</div>
            </div>
            <Popup
                open={popupStatus !== 'close'}
                closeFn={() => setPopupStatus('close')}
            >
                <div className={styles.popup}>
                    <div className={styles.full}>
                        <div
                            className={styles.logo_container}
                            style={{ backgroundColor: backgroundColor || 'white' }}
                        >
                            {fallbackImg ?
                                <div className={styles.fallback_img}>{fallbackImg}</div>
                                :
                                <img
                                    className={styles.logo}
                                    loading='eager'
                                    src={iconPath}
                                    alt={`${name} logo`}
                                    onError={() => setFallbackImg(name)}
                                />
                            }
                        </div>
                        <div className={styles.details}>
                            <div className={styles.retailer_name}>Shop at {name}</div>
                            <div className={styles.cashback_rate}>
                                Up to {cashback} cashback
                            </div>
                        </div>
                    </div>
                    <Markdown className={styles.markdown}>
                        {`${terms}${generalTerms}`}
                    </Markdown>
                    {redirectLink ?
                        <a
                            className={styles.start_btn}
                            onClick={() => setPopupStatus('close')}
                            href={redirectLink}
                            target='_blank'
                        >
                            Start shopping
                        </a>
                        :
                        <button
                            className={styles.start_btn}
                            disabled={true}
                        >
                            Loading
                        </button>
                    }
                    <div className={styles.consent_txt}>
                        By clicking Start Shopping, I accept the terms above.
                    </div>
                </div>
            </Popup>
        </>
    )
}

export default RetailerCard