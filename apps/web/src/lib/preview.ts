import { createHmac, timingSafeEqual } from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'

export const PREVIEW_COOKIE_NAME = 'gov_preview'
export const PREVIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const CANONICAL_PAYLOAD = 'preview'

export function previewCookieValue(secret: string): string {
  return createHmac('sha256', secret).update(CANONICAL_PAYLOAD).digest('hex')
}

export function isPreviewCookieValid(cookie: string, secret: string): boolean {
  if (!cookie || !secret) return false
  const expected = previewCookieValue(secret)
  if (cookie.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(expected))
}

function tokenMatchesSecret(token: string, secret: string): boolean {
  if (!token || !secret || token.length !== secret.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret))
}

/**
 * Server-only: inspects the current request's cookie. Dynamic import keeps the
 * `@tanstack/react-start/server` reference out of any client bundle.
 */
export async function checkPreviewCookie(): Promise<boolean> {
  const secret = process.env.PREVIEW_SECRET
  if (!secret) return false
  const { getCookie } = await import('@tanstack/react-start/server')
  const cookie = getCookie(PREVIEW_COOKIE_NAME)
  if (!cookie) return false
  return isPreviewCookieValid(cookie, secret)
}

export const getIsPreview = createServerFn({ method: 'GET' }).handler(
  (): Promise<boolean> => checkPreviewCookie(),
)

export const enterPreview = createServerFn({ method: 'GET' })
  .inputValidator((raw: unknown) => {
    const token = (raw as { token?: unknown }).token
    return { token: typeof token === 'string' ? token : '' }
  })
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const secret = process.env.PREVIEW_SECRET
    if (!secret || !tokenMatchesSecret(data.token, secret)) {
      return { ok: false }
    }
    const { setCookie } = await import('@tanstack/react-start/server')
    setCookie(PREVIEW_COOKIE_NAME, previewCookieValue(secret), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: PREVIEW_COOKIE_MAX_AGE_SECONDS,
    })
    return { ok: true }
  })

export const exitPreview = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ ok: true }> => {
    const { deleteCookie } = await import('@tanstack/react-start/server')
    deleteCookie(PREVIEW_COOKIE_NAME, { path: '/' })
    return { ok: true }
  },
)
