/** Terms renderer shared by the desktop and mobile T&C views. rehypeRaw keeps the docs' raw `<a id>` anchor targets, which react-markdown would otherwise strip. */
import { useMemo } from 'react'
import Markdown from 'react-markdown'
import type { Components } from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { useRouteLoaderData } from 'react-router-dom'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { ENV } from '../../config'
import { isSupportUrl } from '../../utils/supportUrl'

const rehypePlugins = [rehypeRaw]

const tryParseUrl = (href: string) => {
    try {
        return new URL(href)
    } catch {
        // Malformed link in the terms doc — nothing can make it resolve, so surface it rather than ship a dead link in silence.
        console.error(`[terms] malformed link, rendered untracked: ${href}`)
        return null
    }
}

interface Props {
    terms: string
    className?: string
}

const TermsMarkdown = ({ terms, className }: Props) => {
    const { platform, supportUrl } = useRouteLoaderData('root') as LoaderData
    const { walletAddress, kitUserId } = useWalletAddress()

    // Memoized so react-markdown doesn't re-render the whole terms tree each render.
    const components: Components = useMemo(() => ({
        a: ({ href, children, ...props }) => {
            // Terms are remote, so an href can pass the scheme test and still throw in the URL constructor ("http://" does) — degrade to a plain link instead of taking the route down.
            const url = href && /^https?:\/\//.test(href) ? tryParseUrl(href) : null

            if (!url) {
                return <a href={href} {...props}>{children}</a>
            }

            // Only the support site gets the user's context; the identity must not reach any other destination.
            if (isSupportUrl(url, supportUrl)) {
                url.searchParams.set('platform', platform.toUpperCase())
                url.searchParams.set('address', walletAddress || kitUserId || 'null')
                url.searchParams.set('env', ENV)
            }

            return (
                <a
                    {...props}
                    href={url.toString()}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {children}
                </a>
            )
        },
    }), [platform, supportUrl, walletAddress, kitUserId])

    return (
        <Markdown
            className={className}
            rehypePlugins={rehypePlugins}
            components={components}
        >
            {terms}
        </Markdown>
    )
}

export default TermsMarkdown
