/**
 * Logic hook for the desktop cards list. Fetches the two shared terms
 * documents every card links to and decides when placeholders stand in — so
 * the view is pure UI.
 *
 * Named for the surface because `useCardsList` is the mobile list's hook.
 */
import { useEffect, useState } from 'react'
import fetchTerms from '../../utils/fetchTerms'
import { useSkeletonPreview } from '../../hooks/useSkeletonPreview'

interface Args {
    generalTermsUrl?: string
    topGeneralTermsUrl?: string
    loading: boolean
    hasMetadata: boolean
}

export const useCardsListDesktop = ({ generalTermsUrl, topGeneralTermsUrl, loading, hasMetadata }: Args) => {
    const skeletonPreview = useSkeletonPreview()
    const [generalTerms, setGeneralTerms] = useState('')
    const [topGeneralTerms, setTopGeneralTerms] = useState('')

    useEffect(() => {
        if (!generalTermsUrl || !topGeneralTermsUrl) return
        if (generalTerms && topGeneralTerms) return

        const controller = new AbortController()

        Promise.all([
            fetchTerms(topGeneralTermsUrl),
            fetchTerms(generalTermsUrl)
        ])
            .then(([topTerms, terms]) => {
                if (!controller.signal.aborted) {
                    setTopGeneralTerms(topTerms)
                    setGeneralTerms(terms)
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) {
                    console.error('Failed to fetch terms:', error)
                }
            })
        return () => controller.abort()
    }, [generalTermsUrl, topGeneralTermsUrl, generalTerms, topGeneralTerms])

    return {
        generalTerms,
        topGeneralTerms,
        // No metadata means no icon or terms paths, so the cards cannot render.
        showSkeleton: loading || skeletonPreview || !hasMetadata,
    }
}
