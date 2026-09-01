/**
 * Wallet ↔ email pairing — the three `/v1/auth/pair/*` endpoints of the
 * `bringAuth` lambda (backend `apiHandlers/bringAuth/pair/`).
 *
 * The flow is three calls with a wallet signature between the last two:
 *   initiate  → emails an OTP, hands back the Cognito `session` + `codeLength`
 *   verifyOtp → answers the challenge, hands back `nonce` + the text to sign
 *   confirm   → proves address ownership with the signature, writes the pair
 *
 * The endpoints resolve the platform from the API-key identity, so — like every
 * other portal call (fetchCache, fetchRetailers, activate, claim/*) — the body
 * carries `platform`. Bodies are `{ email, address, flowId, platform }`,
 * `{ email, address, code, session, flowId, platform }` and
 * `{ nonce, signature, flowId, platform }`. Failures answer with `{ reason }`
 * rather than `{ message }`.
 */
import { API_URL_AUTH, API_KEY } from '../config'

/**
 * Failure reasons the pairing endpoints return, by the step that can emit them.
 *
 * A missing or non-allowlisted `platform` never reaches them: it fails in the
 * shared API-gateway setup with `401 { message: 'Forbidden' }`, which has no
 * `reason` field, so `authPost` surfaces it as `internal_error`.
 */
export type PairReason =
    // shared prelude (auth-context.ts) — a platform the backend knows but has
    // no Cognito pool for
    | 'unknown_platform'
    | 'internal_error'
    // initiate
    | 'invalid_email'
    | 'invalid_address'
    | 'email_not_registered'
    | 'too_many_attempts'
    // initiate + confirm — the pairing preconditions (pair-queries.ts)
    | 'address_already_paired'
    | 'email_already_paired'
    | 'address_has_rewards'
    // verify-otp — Cognito verification outcomes, distinguishable on purpose
    | 'missing_fields'
    | 'wrong_code'
    | 'expired'
    | 'session_invalid'
    // confirm
    | 'nonce_invalid'
    | 'signature_mismatch'
    | 'already_paired'
    // client-side only
    | 'network_error'

export interface PairFailure {
    ok: false
    status: number
    reason: PairReason
    /** Cognito sessions are single-use: on `wrong_code` it re-issues one and
     *  the client must replace its stored value before retrying. */
    session?: string
}

export type PairResult<T> = ({ ok: true } & T) | PairFailure

/** Platform + flowId ride along on every pairing call. */
interface AuthBody {
    platform: string
    flowId: string
}

const authPost = async <T>(path: string, body: AuthBody): Promise<PairResult<T>> => {
    try {
        const res = await fetch(`${API_URL_AUTH}${path}`, {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            return {
                ok: false,
                status: res.status,
                reason: (data.reason as PairReason) || 'internal_error',
                ...(data.session ? { session: data.session as string } : {}),
            }
        }
        return { ok: true, ...(data as T) }
    } catch {
        return { ok: false, status: 0, reason: 'network_error' }
    }
}

export interface PairChallenge {
    /** Cognito challenge session — passed straight back to verify-otp. */
    session: string
    /** 8 on the sign-in path pairing always takes; 6 only if the account was
     *  never confirmed. Drives how many code inputs to render. */
    codeLength: 6 | 8
}

/**
 * Validates in order — registered CONFIRMED email, neither side already
 * paired, the address holds no rewards — and only then sends the code. Shares
 * the `/otp/send` rate-limit counters (60s cooldown, 5 per 24h per email).
 */
export const pairInitiate = (body: AuthBody & { email: string; address: string }) =>
    authPost<PairChallenge>('pair/initiate', body)

export interface PairNonce {
    /** Single-use, 5-minute TTL, pinned to the address it was issued for. */
    nonce: string
    /** Rebuilt server-side on confirm — sign exactly this text. */
    message: string
}

export const pairVerifyOtp = (
    body: AuthBody & { email: string; address: string; code: string; session: string },
) => authPost<PairNonce>('pair/verify-otp', body)

/**
 * Consumes the nonce and persists the pair. Everything trusted comes from the
 * nonce row — the request contributes only the nonce and the signature (base58,
 * the same shape the claim flow's `SIGNATURE` message already returns).
 */
export const pairConfirm = (body: AuthBody & { nonce: string; signature: string }) =>
    authPost<{ message: 'paired' }>('pair/confirm', body)
