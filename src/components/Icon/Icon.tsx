import { ImgHTMLAttributes, useEffect, useState } from 'react'
import { useRouteLoaderData } from 'react-router-dom'

interface IconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    /** File name inside the platform's icon folder, e.g. `wallet.svg`. */
    name: string
    /**
     * Optional secondary file name to try before falling back to DEFAULT.
     * Useful for theme variants like `arrow-left-light.svg → arrow-left.svg`.
     */
    fallbackName?: string
}

/**
 * Renders an `<img>` for a portal icon, with automatic fallback to the
 * DEFAULT platform's icon folder when the active platform doesn't ship
 * the requested asset.
 *
 * Resolution chain (each step only fires after the previous 404s):
 *   1. /{PLATFORM}/icons/{theme}/{name}
 *   2. /{PLATFORM}/icons/{theme}/{fallbackName}     (if provided)
 *   3. /DEFAULT/icons/{theme}/{fallbackName ?? name}
 */
const Icon = ({ name, fallbackName, onError, alt = '', ...rest }: IconProps) => {
    const { iconsPath, defaultIconsPath } = useRouteLoaderData('root') as LoaderData

    const candidates = [
        `${iconsPath}/${name}`,
        ...(fallbackName ? [`${iconsPath}/${fallbackName}`] : []),
        `${defaultIconsPath}/${fallbackName ?? name}`,
    ]

    const [step, setStep] = useState(0)

    useEffect(() => {
        setStep(0)
    }, [name, fallbackName, iconsPath, defaultIconsPath])

    return (
        <img
            {...rest}
            alt={alt}
            src={candidates[step]}
            onError={(e) => {
                if (step < candidates.length - 1) {
                    setStep(step + 1)
                } else {
                    onError?.(e)
                }
            }}
        />
    )
}

export default Icon
