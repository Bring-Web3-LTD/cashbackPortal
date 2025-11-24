import styles from './styles.module.css'
import { useEffect, useMemo, useState } from 'react'
import formatCashback from '../../utils/formatCashback'
import { useRouteLoaderData } from 'react-router-dom'
import activate from '../../api/activate'
import RetailerCardModal from '../Modals/RetailerCardModal/RetailerCardModal'
import { useGoogleAnalytics } from '../../utils/hooks/useGoogleAnalytics'
import { useWalletAddress } from '../../utils/hooks/useWalletAddress'
import LoginModal from '../Modals/LoginModal/LoginModal'
import fetchTerms from '../../utils/fetchTerms'

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
    topGeneralTerms: string
    campaignUrl?: string
    generalTerms: string
    termsUrl: string
    search: ReactSelectOptionType | null
    isDemo: boolean
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
    campaignUrl,
    topGeneralTerms,
    generalTerms,
    search,
    isDemo,
    campaignId
}: Props) => {
    const { platform, cryptoSymbols, userId, flowId, iconsPath } = useRouteLoaderData('root') as LoaderData
    const { walletAddress, isTester } = useWalletAddress()
    const { sendGaEvent } = useGoogleAnalytics()
    const [fallbackImg, setFallbackImg] = useState('')
    const [redirectLink, setRedirectLink] = useState('')
    const [popupData, setPopupData] = useState<{ iframeUrl?: string, token?: string, domain?: string }>({})
    const [modalState, setModalState] = useState('close')
    const [loginModalState, setLoginModalState] = useState('close')
    const [terms, setTerms] = useState('')

    const cashback = useMemo(() => formatCashback(maxCashback, cashbackSymbol, cashbackCurrency), [cashbackCurrency, cashbackSymbol, maxCashback])
    const isBig = useMemo(() => isBigCashback(cashbackSymbol, maxCashback), [cashbackSymbol, maxCashback])
    const isCampaign = useMemo(() => Boolean(campaignId), [campaignId])

    const activateDeal = async () => {
        if (!walletAddress) return

        const body: Parameters<typeof activate>[0] = {
            platform,
            itemId: id,
            walletAddress,
            userId,
            flowId,
            tokenSymbol: cryptoSymbols[0]
        }

        if (search?.value) body['search'] = search.value

        if (isTester && isDemo) body.isDemo = true

        const res = await activate(body)
        setPopupData({
            iframeUrl: res.iframeUrl,
            token: res.token,
            domain: res.domain
        })
        setRedirectLink(res.url)
        setModalState('open')
    }

    const handleClick = () => {
        if (!walletAddress) {
            setLoginModalState('open')
            return
        }
        activateDeal()
        setModalState('loading')
        sendGaEvent('retailer_open', {
            category: 'user_action',
            action: 'click',
            details: name,
            process: 'activate'
        })
    }

    useEffect(() => {
        if (!termsUrl || terms.length || modalState === 'close') return

        const fetches = [fetchTerms(termsUrl)]
        if (campaignUrl) fetches.push(fetchTerms(campaignUrl))

        Promise.all(fetches)
            .then(([retailerTerms, campaignTerms]) => {
                setTerms(campaignTerms || topGeneralTerms + retailerTerms + generalTerms)
            })
            .catch(console.error)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalState])

    return (
        <>
            <div
                id={`retailer-card-${name}`}
                className={styles.card}
                style={isCampaign ? { background: `url(${iconsPath}/campaign-card-background.png) lightgray 50% / cover no-repeat` } : {}}
                onClick={handleClick}
            >
                {isBig || isCampaign ? <div className={`${styles.flag} ${isCampaign ? styles.flag_campaign : ''}`}>{cashback}</div> : null}
                <div
                    className={`${styles.logo_container} ${isCampaign ? styles.logo_container_campaign : ''}`}
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
                <div className={`${styles.cashback_rate} ${isCampaign ? styles.cashback_rate_campaign : ''}`}>{isCampaign ? '' : 'Up to '}{cashback} cashback</div>
            </div>
            <RetailerCardModal
                open={modalState !== 'close'}
                closeFn={() => {
                    setModalState('close')
                    sendGaEvent('popup_close', {
                        category: 'user_action',
                        action: 'click',
                        details: 'Retailer',
                    })
                }}
                backgroundColor={backgroundColor}
                iconPath={iconPath}
                name={name}
                cashback={cashback}
                terms={terms}
                redirectLink={redirectLink}
                {...popupData}
            />
            <LoginModal
                open={loginModalState !== 'close'}
                closeFn={() => setLoginModalState('close')}
            />
        </>
    )
}

export default RetailerCard