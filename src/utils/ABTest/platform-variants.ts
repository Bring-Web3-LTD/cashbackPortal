import { TEST_ID } from "../../config"
import murmurhash from "./murmurhash"

export type PlatformName = string

export type VariantDistribution = {
  [variant: string]: number
}

export type VariantsConfig = {
  [platformName: string]: VariantDistribution
}

// Variant distributions per platform (percentages, must sum to 100)
export const variants: VariantsConfig = {
  default: {
    control: 50,
    testA: 50    
  },
}

export type VariantKey = keyof typeof variants['default']

export const getVariantDistribution = (platformName: PlatformName): VariantDistribution => {
  return variants[platformName as keyof typeof variants] || variants.default
}

// Deterministically select a variant for a user, based on a hash of TEST_ID + platform + userId
export const selectVariant = (userId: string, platformName: PlatformName = 'default'): VariantKey => {
  platformName = platformName.toLowerCase()
  const variantDistribution = getVariantDistribution(platformName)

  const companyOverride = checkCompanyOverride(platformName)
  if (companyOverride) return companyOverride

  const hash = Math.abs(murmurhash(`${TEST_ID}-${platformName}-${userId}`)) % 100

  const cumulativeDistribution: { variant: VariantKey; weight: number }[] = []
  let cumulativeWeight = 0
  const variantKeys = Object.keys(variantDistribution) as VariantKey[]

  for (const variant of variantKeys) {
    cumulativeWeight += variantDistribution[variant]
    cumulativeDistribution.push({ variant, weight: cumulativeWeight })
  }

  for (const { variant, weight } of cumulativeDistribution) {
    if (hash < weight) return variant
  }

  return variantKeys[variantKeys.length - 1]
}

// Forced variant override (e.g. contract requirements, emergency rollback)
const checkCompanyOverride = (platformName: PlatformName): VariantKey | null => {
  if (!platformName) return null
  return null
}

// Run a sub-experiment within a parent variant
export const selectNestedVariant = (userId: string, platformName: PlatformName, parentVariant: string): string => {
  const nestedTestId = `${TEST_ID}-${parentVariant}`
  const hash = Math.abs(murmurhash(`${nestedTestId}-${platformName}-${userId}`)) % 100

  const subVariants: { [key: string]: number } = {
    sub_control: 50,
    sub_test: 50,
  }

  const variants = Object.keys(subVariants)
  let cumulativeWeight = 0

  for (const variant of variants) {
    cumulativeWeight += subVariants[variant]
    if (hash < cumulativeWeight) {
      return variant
    }
  }

  return variants[variants.length - 1]
}

// Map variants to enabled features
export const hasFeature = (userId: string, platformName: PlatformName, featureName: string): boolean => {
  const variant = selectVariant(userId, platformName)

  const featureFlagMap: Record<string, string[]> = {
    control: ['basic_dashboard', 'export_data'],
    testA: ['basic_dashboard', 'export_data', 'advanced_analytics'],
    testB: ['basic_dashboard', 'export_data', 'new_ui_design'],
  }

  return (featureFlagMap[variant] || []).includes(featureName)
}
