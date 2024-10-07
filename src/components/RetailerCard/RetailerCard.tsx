import styles from './styles.module.css'
import { useCallback, useEffect, useState } from 'react'
import formatCashback from '../../utils/formatCashback'
import { useRouteLoaderData } from 'react-router-dom'
import activate from '../../api/activate'
import RetailerCardModal from '../Modals/RetailerCardModal/RetailerCardModal'

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
    const { walletAddress, platform, cryptoSymbols } = useRouteLoaderData('root') as LoaderData
    const [fallbackImg, setFallbackImg] = useState('')
    const [redirectLink, setRedirectLink] = useState('')
    const [modalState, setModalState] = useState('close')
    const [terms, setTerms] = useState('')

    const cashback = formatCashback(maxCashback, cashbackSymbol, cashbackCurrency)
    const isBig = isBigCashback(cashbackSymbol, maxCashback)

    const activateDeal = useCallback(async () => {
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
        setModalState('open')
    }, [cryptoSymbols, id, platform, search?.value, walletAddress])

    useEffect(() => {
        if (modalState === 'loading') {
            activateDeal()
        }

        if (!termsUrl || terms.length || modalState === 'close') return

        fetch(termsUrl)
            .then(res => res.text())
            .then(data => setTerms(data))
    }, [activateDeal, modalState, terms.length, termsUrl])

    return (
        <>
            <div
                className={styles.card}
                onClick={() => setModalState('loading')}
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
            <RetailerCardModal
                open={modalState !== 'close'}
                closeFn={() => setModalState('close')}
                backgroundColor={backgroundColor}
                iconPath={iconPath}
                name={name}
                cashback={cashback}
                terms={terms}
                generalTerms={generalTerms}
                redirectLink={redirectLink}
            />
            {/* <Modal
                open={modalState !== 'close'}
                closeFn={() => setModalState('close')}
            >
                <div className={styles.modal}>
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
                    {terms ?
                        <Markdown className={styles.markdown}>
                            {`${terms}${generalTerms}`}
                        </Markdown>
                        :
                        <div className={`${styles.markdown} ${styles.center}`}>
                            Loading...
                        </div>
                    }
                    {redirectLink && terms ?
                        <a
                            className={styles.start_btn}
                            onClick={() => setModalState('close')}
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
            </Modal> */}
        </>
    )
}

export default RetailerCard