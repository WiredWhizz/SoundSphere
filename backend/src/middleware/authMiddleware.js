import { extractBearerToken, verifyAuthToken } from '../auth.js'
import { getUserById } from '../userStore.js'

async function loadUserFromToken(request) {
  const token = extractBearerToken(request.headers.authorization)
  if (!token) {
    return null
  }

  try {
    const payload = verifyAuthToken(token)
    const user = await getUserById(payload.userId)
    return user ? { id: payload.userId, ...user } : null
  } catch {
    return null
  }
}

export async function optionalAuth(request, _response, next) {
  request.user = await loadUserFromToken(request)
  next()
}

export async function requireAuth(request, response, next) {
  const user = request.user ?? await loadUserFromToken(request)

  if (!user) {
    response.status(401).json({ error: 'Authentication required.' })
    return
  }

  request.user = user
  next()
}
