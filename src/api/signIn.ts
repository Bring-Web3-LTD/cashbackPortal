/**
 * Email sign-up / sign-in on the standalone portal - the `/v1/auth/otp/*` and
 * `/v1/auth/google` endpoints of the `bringAuth` lambda, the same calls the
 * landing pages make. A success sets the session cookies (HttpOnly), which is
 * why these go through `apiFetch` with the cookies enabled.
 *
 * `id` is the campaign a landing-page visitor brought along: with it the
 * request is a campaign registration like on the landing page; without it the
 * platform comes from the API key and the account gets no campaign.
 */
import { API_URL_AUTH } from '../config'
import { apiFetch } from './request'

interface SignInBody {
  platform: string
  flowId: string
  id?: string
  clickId?: string
}

const post = (path: string, body: object) =>
  apiFetch(`${API_URL_AUTH}${path}`, { method: 'POST', json: body })

/** 200 `{ session, codeLength }` (6-digit sign-up, 8-digit sign-in); 429 when rate-limited. */
export const otpSend = (body: SignInBody & { email: string }) => post('otp/send', body)

/** 200 + cookies; otherwise `{ reason, session? }` - a fresh `session` must replace the stored one. */
export const otpVerify = (body: SignInBody & { email: string; code: string; session: string }) =>
  post('otp/verify', body)

/** `code` is the popup's one-time authorization code (utils/google.ts). 200 `{ email }` + cookies. */
export const googleSignIn = (body: SignInBody & { code: string }) => post('google', body)
