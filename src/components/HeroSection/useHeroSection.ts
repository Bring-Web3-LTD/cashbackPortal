/**
 * Type contract for the mobile HeroSection. HeroSection just composes
 * CashbackEarned + Rewards (no runtime logic), so this file holds only its
 * props interface.
 */
export interface HeroSectionProps {
    onClaim?: () => void
}
