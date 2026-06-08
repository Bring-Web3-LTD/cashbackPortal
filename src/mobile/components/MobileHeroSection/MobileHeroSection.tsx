import MobileCashbackEarned from '../MobileCashbackEarned/MobileCashbackEarned'
import MobileRewards from '../MobileRewards/MobileRewards'

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
