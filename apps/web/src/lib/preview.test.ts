import { describe, it, expect } from 'vitest'
import { previewCookieValue, isPreviewCookieValid } from './preview'

const SECRET_A = 'secret-a-0123456789abcdef'
const SECRET_B = 'secret-b-0123456789abcdef'

describe('previewCookieValue', () => {
  it('is deterministic for a given secret', () => {
    expect(previewCookieValue(SECRET_A)).toBe(previewCookieValue(SECRET_A))
  })

  it('differs between secrets', () => {
    expect(previewCookieValue(SECRET_A)).not.toBe(previewCookieValue(SECRET_B))
  })

  it('does not contain the secret in plain text', () => {
    expect(previewCookieValue(SECRET_A)).not.toContain(SECRET_A)
  })
})

describe('isPreviewCookieValid', () => {
  it('accepts the canonical value for the secret', () => {
    const cookie = previewCookieValue(SECRET_A)
    expect(isPreviewCookieValid(cookie, SECRET_A)).toBe(true)
  })

  it('rejects a value signed with a different secret', () => {
    const cookie = previewCookieValue(SECRET_B)
    expect(isPreviewCookieValid(cookie, SECRET_A)).toBe(false)
  })

  it('rejects a tampered value', () => {
    const cookie = previewCookieValue(SECRET_A)
    const tampered = cookie.slice(0, -1) + (cookie.endsWith('a') ? 'b' : 'a')
    expect(isPreviewCookieValid(tampered, SECRET_A)).toBe(false)
  })

  it('rejects an empty cookie', () => {
    expect(isPreviewCookieValid('', SECRET_A)).toBe(false)
  })

  it('rejects when secret is empty', () => {
    const cookie = previewCookieValue(SECRET_A)
    expect(isPreviewCookieValid(cookie, '')).toBe(false)
  })
})
