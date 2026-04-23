import express from 'express'
import { signAuthToken } from '../auth.js'
import { createUser, getUserByEmail } from '../userStore.js'
import { verifyPassword } from '../userStore.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

function serializeUser(userRecord) {
  return {
    id: userRecord.profile.id,
    email: userRecord.profile.email,
    name: userRecord.profile.name,
    avatar: userRecord.profile.avatar,
  }
}

function buildAuthResponse(userRecord) {
  return {
    token: signAuthToken({
      userId: userRecord.profile.id,
      email: userRecord.profile.email,
    }),
    user: serializeUser(userRecord),
    state: userRecord.state,
  }
}

function statusForAuthError(error) {
  if (error.message?.includes('Database is not configured')) {
    return 500
  }

  return 400
}

async function registerHandler(request, response) {
  const email = request.body?.email?.trim()
  const password = request.body?.password ?? ''
  const name = request.body?.name?.trim()

  if (!email || !password) {
    response.status(400).json({ error: 'Email and password are required.' })
    return
  }

  try {
    const user = await createUser({ email, password, name })
    response.status(201).json(buildAuthResponse(user))
  } catch (error) {
    response
      .status(statusForAuthError(error))
      .json({ error: error.message || 'Unable to create account.' })
  }
}

router.post('/register', registerHandler)
router.post('/signup', registerHandler)

router.post('/login', async (request, response) => {
  const email = request.body?.email?.trim()
  const password = request.body?.password ?? ''

  if (!email || !password) {
    response.status(400).json({ error: 'Email and password are required.' })
    return
  }

  try {
    const user = await getUserByEmail(email)
    if (!user) {
      response.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    const isValidPassword = await verifyPassword(password, user.credentials.passwordHash)
    if (!isValidPassword) {
      response.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    response.json(buildAuthResponse(user))
  } catch (error) {
    response
      .status(error.message?.includes('Database is not configured') ? 500 : 400)
      .json({ error: error.message || 'Unable to log in.' })
  }
})

router.get('/me', requireAuth, (request, response) => {
  response.json({
    user: serializeUser(request.user),
    state: request.user.state,
  })
})

router.post('/logout', (_request, response) => {
  response.status(204).end()
})

export { router as authRoutes }
