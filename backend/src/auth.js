import jwt from 'jsonwebtoken'

const DEFAULT_EXPIRY = '7d'

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is missing. Set it in the backend environment.')
  }

  return secret
}

export function signAuthToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRY,
  })
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret())
}

export function extractBearerToken(authorizationHeader = '') {
  if (!authorizationHeader.startsWith('Bearer ')) {
    return null
  }

  return authorizationHeader.slice('Bearer '.length).trim() || null
}
