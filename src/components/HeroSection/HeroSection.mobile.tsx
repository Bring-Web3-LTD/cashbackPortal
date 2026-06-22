import CashbackEarned from '../CashbackEarned/CashbackEarned.mobile'
import Rewards from '../Rewards/Rewards.mobile'
import { HeroSectionProps } from './useHeroSection'

const HeroSection = ({ onClaim }: HeroSectionProps) => (
    <>
        <CashbackEarned />
        <Rewards onClaim={onClaim} />
    </>
)

export default HeroSection
