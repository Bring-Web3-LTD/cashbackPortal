import MobileCashbackEarned from '../MobileCashbackEarned/MobileCashbackEarned'
import MobileRewards from '../../../components/Rewards/Rewards.mobile'

interface Props {
    onClaim?: () => void
}

const MobileHeroSection = ({ onClaim }: Props) => (
    <>
        <MobileCashbackEarned />
        <MobileRewards onClaim={onClaim} />
    </>
)

export default MobileHeroSection
