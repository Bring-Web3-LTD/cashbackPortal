import CashbackEarned from '../CashbackEarned/CashbackEarned.mobile'
import Rewards from '../Rewards/Rewards.mobile'

interface Props {
    onClaim?: () => void
}

const HeroSection = ({ onClaim }: Props) => (
    <>
        <CashbackEarned />
        <Rewards onClaim={onClaim} />
    </>
)

export default HeroSection
