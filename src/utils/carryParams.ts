// Keeps the URL's search params across in-app navigation.
// react-router drops the query string when a call site passes a bare path,
// so every internal navigate / Link / Navigate goes through these wrappers.
// Direct imports from react-router-dom are blocked in eslint.config.js.
import { createElement, forwardRef, useCallback } from 'react'
import {
    Link as RouterLink,
    Navigate as RouterNavigate,
    parsePath,
    useLocation,
    useNavigate as useRouterNavigate,
    type LinkProps,
    type NavigateOptions,
    type NavigateProps,
    type To,
} from 'react-router-dom'

// Every param is carried except these. token is the session JWT (CLAUDE.md,
// GDPR rule 5): it must not follow the user onto other pages.
export const NOT_CARRIED = ['token']

// The target's own params win over the current ones. Path, hash and relative
// paths ('..') are left for the router to resolve.
export const carrySearch = (to: To, currentSearch: string): To => {
    // Absolute URL (https:, mailto:, //host): external, so no params, and kept
    // a string so react-router still renders it as an external href.
    if (typeof to === 'string' && /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(to)) return to
    const target = typeof to === 'string' ? parsePath(to) : to
    const own = new URLSearchParams(target.search)
    const params = new URLSearchParams(currentSearch)
    NOT_CARRIED.forEach(name => params.delete(name))
    own.forEach((_, name) => params.delete(name))
    own.forEach((value, name) => params.append(name, value))
    const search = params.toString()
    return { ...target, search: search ? `?${search}` : '' }
}

// Reads the search at call time, so the returned function keeps a stable
// identity like react-router's own.
export const useNavigate = () => {
    const navigate = useRouterNavigate()
    return useCallback((to: To | number, options?: NavigateOptions) => typeof to === 'number'
        ? navigate(to)
        : navigate(carrySearch(to, window.location.search), options), [navigate])
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
    const { search } = useLocation()
    return createElement(RouterLink, { ...props, ref, to: carrySearch(props.to, search) })
})
Link.displayName = 'Link'

export const Navigate = (props: NavigateProps) => {
    const { search } = useLocation()
    return createElement(RouterNavigate, { ...props, to: carrySearch(props.to, search) })
}
