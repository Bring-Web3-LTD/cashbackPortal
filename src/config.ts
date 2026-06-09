export const API_KEY = import.meta.env.VITE_API_KEY || ''
export const API_URL_PLATFORMS = `${import.meta.env.VITE_API_URL}platforms/`
export const API_URL_PORTAL = `${import.meta.env.VITE_API_URL}portal/`
export const DEV_MODE = import.meta.env.VITE_ENV === 'development'
export const GA_MEASUREMENT_ID = import.meta.env.VITE_ENV_GA_MEASUREMENT_ID || ''
export const TEST_ID = import.meta.env.VITE_TEST_ID || ''
export const ENV = import.meta.env.VITE_ENV || 'development'
export const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'
export const SHOW_TERMS_PLATFORMS = import.meta.env.VITE_SHOW_TERMS_PLATFORMS ? import.meta.env.VITE_SHOW_TERMS_PLATFORMS.split(',') : []
export const currencyFormat = 'code'

// Mobile Portal — opt-in per platform, only renders below the viewport threshold.
export const MOBILE_PORTAL_PLATFORMS: string[] = import.meta.env.VITE_MOBILE_PORTAL_PLATFORMS
    ? import.meta.env.VITE_MOBILE_PORTAL_PLATFORMS.split(',')
    : []
export const MOBILE_PORTAL_MAX_WIDTH: number = import.meta.env.VITE_MOBILE_PORTAL_MAX_WIDTH
    ? Number(import.meta.env.VITE_MOBILE_PORTAL_MAX_WIDTH)
    : 360