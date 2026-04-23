import crypto from 'node:crypto'

const SESSION_COOKIE = 'soundsphere_session'

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function signValue(value, secret) {
  return base64Url(
    crypto.createHmac('sha256', secret).update(value).digest(),
  )
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  if (left.length !== right.length) {
    return false
  }

  return crypto.timingSafeEqual(left, right)
}

export function createSessionCookie(userId, secret) {
  const issuedAt = Date.now()
  const raw = `${userId}.${issuedAt}`
  const signature = signValue(raw, secret)
  return `${raw}.${signature}`
}

export function readSessionCookie(cookieValue, secret) {
  if (!cookieValue) {
    return null
  }

  const parts = cookieValue.split('.')
  if (parts.length !== 3) {
    return null
  }

  const [userId, issuedAt, signature] = parts
  const raw = `${userId}.${issuedAt}`
  const expectedSignature = signValue(raw, secret)

  if (!timingSafeEqualString(signature, expectedSignature)) {
    return null
  }

  return {
    userId,
    issuedAt: Number(issuedAt),
  }
}

export { SESSION_COOKIE }
