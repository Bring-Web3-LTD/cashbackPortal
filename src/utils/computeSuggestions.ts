export type SuggestionItem = { id: string; name: string }

/**
 * Two-pass autocomplete matcher: first prefer names that start with `query`,
 * then fall back to word-boundary matches so "express" still surfaces
 * "AliExpress". De-duped, case-insensitive. Empty query → empty list.
 */
export const computeSuggestions = (
    retailers: readonly SuggestionItem[],
    query: string,
): SuggestionItem[] => {
    if (!query) return []
    const needle = query.toLowerCase()
    const seen = new Set<string>()
    const out: SuggestionItem[] = []

    for (const r of retailers) {
        const lower = r.name.toLowerCase()
        if (seen.has(lower) || !lower.startsWith(needle)) continue
        seen.add(lower)
        out.push({ id: r.id, name: r.name })
    }
    for (const r of retailers) {
        const lower = r.name.toLowerCase()
        if (seen.has(lower)) continue
        if (lower.split(/\s+/).some(w => w.startsWith(needle))) {
            seen.add(lower)
            out.push({ id: r.id, name: r.name })
        }
    }
    return out
}
