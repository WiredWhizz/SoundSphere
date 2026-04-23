import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { createSessionCookie, readSessionCookie, SESSION_COOKIE } from './auth.js'
import { hasDatabaseConfig } from './db.js'
import {
  createLocalUser,
  defaultUserState,
  getUserByEmail,
  getUserById,
  updateUserState,
  verifyPassword,
} from './userStore.js'

dotenv.config()

const app = express()
const API_KEY = process.env.YOUTUBE_API_KEY
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this_to_a_long_random_secret'

const HOME_SECTIONS = [
  {
    id: 'made-for-you',
    title: 'Made for you',
    subtitle: 'Daily mixes shaped around popular moods and artists.',
    query: 'romantic bollywood hits',
  },
  {
    id: 'recently-trending',
    title: 'Trending now',
    subtitle: 'Fresh tracks and repeat-worthy favorites.',
    query: 'latest hindi songs 2026',
  },
  {
    id: 'feel-good',
    title: 'Feel good hits',
    subtitle: 'Sunny playlists, roadtrip songs, and comfort tracks.',
    query: 'feel good bollywood songs',
  },
]

const FEATURED_COLLECTIONS = [
  {
    id: 'liked-songs',
    title: 'Liked Songs',
    subtitle: '128 songs',
    query: 'best romantic songs arijit singh',
  },
  {
    id: 'chill-vibes',
    title: 'Chill Vibes',
    subtitle: '32 songs',
    query: 'chill lofi indian songs',
  },
  {
    id: 'workout-mix',
    title: 'Workout Mix',
    subtitle: '40 songs',
    query: 'workout hindi songs',
  },
  {
    id: 'favorites',
    title: 'My Favorites',
    subtitle: '25 songs',
    query: 'best of arijit singh jukebox',
  },
]

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 45,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please wait a moment and try again.',
  },
})

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN?.split(',').map((origin) => origin.trim()) || '*',
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json())
app.use('/api', limiter)

app.use(async (request, _response, next) => {
  const session = readSessionCookie(request.cookies[SESSION_COOKIE], SESSION_SECRET)

  if (!session?.userId) {
    request.user = null
    next()
    return
  }

  const user = await getUserById(session.userId)
  request.user = user ? { id: session.userId, ...user } : null
  next()
})

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, app: 'SoundSphere' })
})

function ensureApiKey(response) {
  if (API_KEY) {
    return true
  }

  response.status(500).json({ error: 'The server is missing YOUTUBE_API_KEY.' })
  return false
}

function ensureDatabase(response) {
  if (hasDatabaseConfig()) {
    return true
  }

  response.status(500).json({
    error: 'MySQL is not configured. Add MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE to backend/.env.',
  })
  return false
}

function requireAuth(request, response) {
  if (request.user) {
    return true
  }

  response.status(401).json({ error: 'Authentication required.' })
  return false
}

function serializeUser(userRecord) {
  return {
    id: userRecord.profile.id,
    email: userRecord.profile.email,
    name: userRecord.profile.name,
    avatar: userRecord.profile.avatar,
  }
}

function parseIsoDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) {
    return 0
  }

  const [, hours = '0', minutes = '0', seconds = '0'] = match
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function normalizeYouTubeErrorMessage(message) {
  if (!message) {
    return 'Unexpected backend error while contacting YouTube.'
  }

  const lowerMessage = message.toLowerCase()
  if (
    lowerMessage.includes('quota') ||
    lowerMessage.includes('daily limit exceeded') ||
    lowerMessage.includes('exceeded your')
  ) {
    return 'OUT OF DAILY LIMITS'
  }

  return message
}

async function searchYouTubeTracks(query, maxResults = 12) {
  const params = new URLSearchParams({
    key: API_KEY,
    part: 'snippet',
    type: 'video',
    maxResults: String(maxResults),
    q: `${query} music`,
    videoCategoryId: '10',
    fields:
      'items(id/videoId,snippet/title,snippet/channelTitle,snippet/description,snippet/publishedAt,snippet/thumbnails/default/url,snippet/thumbnails/medium/url,snippet/thumbnails/high/url)',
  })

  const youtubeResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
  )

  if (!youtubeResponse.ok) {
    const errorPayload = await youtubeResponse.json().catch(() => null)
    throw new Error(
      normalizeYouTubeErrorMessage(
        errorPayload?.error?.message ?? 'YouTube search failed. Please try again later.',
      ),
    )
  }

  const data = await youtubeResponse.json()
  const baseItems = (data.items ?? [])
    .filter((item) => item.id?.videoId && item.snippet)
    .map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail:
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        '',
    }))

  if (baseItems.length === 0) {
    return []
  }

  const detailsParams = new URLSearchParams({
    key: API_KEY,
    part: 'contentDetails',
    id: baseItems.map((item) => item.id).join(','),
  })

  const detailsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${detailsParams.toString()}`,
  )

  if (!detailsResponse.ok) {
    return baseItems
  }

  const detailsPayload = await detailsResponse.json()
  const durationMap = new Map(
    (detailsPayload.items ?? []).map((item) => {
      const durationSec = parseIsoDuration(item.contentDetails?.duration ?? 'PT0S')
      return [item.id, { durationSec, durationLabel: formatDuration(durationSec) }]
    }),
  )

  return baseItems.map((item) => ({
    ...item,
    ...durationMap.get(item.id),
  }))
}

async function buildCollection(definition, size) {
  const tracks = await searchYouTubeTracks(definition.query, size)
  return {
    id: definition.id,
    title: definition.title,
    subtitle: definition.subtitle,
    cover: tracks[0]?.thumbnail ?? '',
    tracks,
  }
}

app.post('/api/auth/signup', async (request, response) => {
  if (!ensureDatabase(response)) {
    return
  }

  const name = request.body?.name?.trim()
  const email = request.body?.email?.trim().toLowerCase()
  const password = request.body?.password ?? ''

  if (!name || !email || !password) {
    response.status(400).json({ error: 'Name, email, and password are required.' })
    return
  }

  try {
    const user = await createLocalUser({ name, email, password })
    const sessionCookie = createSessionCookie(user.profile.id, SESSION_SECRET)

    response.cookie(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    })

    response.status(201).json({
      user: serializeUser(user),
      state: user.state,
    })
  } catch (error) {
    response.status(400).json({ error: error.message || 'Unable to create account.' })
  }
})

app.post('/api/auth/login', async (request, response) => {
  if (!ensureDatabase(response)) {
    return
  }

  const email = request.body?.email?.trim().toLowerCase()
  const password = request.body?.password ?? ''

  if (!email || !password) {
    response.status(400).json({ error: 'Email and password are required.' })
    return
  }

  const user = await getUserByEmail(email)
  if (!user) {
    response.status(401).json({ error: 'Invalid email or password.' })
    return
  }

  const valid = await verifyPassword(password, user.credentials.passwordHash)
  if (!valid) {
    response.status(401).json({ error: 'Invalid email or password.' })
    return
  }

  const sessionCookie = createSessionCookie(user.profile.id, SESSION_SECRET)
  response.cookie(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 30,
  })

  response.json({
    user: serializeUser(user),
    state: user.state,
  })
})

app.post('/api/auth/logout', (_request, response) => {
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  })
  response.status(204).end()
})

app.get('/api/auth/me', (request, response) => {
  if (!ensureDatabase(response)) {
    return
  }

  if (!request.user) {
    response.status(401).json({ error: 'Not signed in.' })
    return
  }

  response.json({
    user: serializeUser(request.user),
    state: request.user.state,
  })
})

app.get('/api/user/state', (request, response) => {
  if (!ensureDatabase(response)) {
    return
  }

  if (!requireAuth(request, response)) {
    return
  }

  response.json({ state: request.user.state })
})

app.put('/api/user/state', async (request, response) => {
  if (!ensureDatabase(response)) {
    return
  }

  if (!requireAuth(request, response)) {
    return
  }

  const nextState = request.body?.state ?? {}
  const updated = await updateUserState(request.user.id, nextState)
  response.json({ state: updated?.state ?? defaultUserState })
})

app.get('/api/search', async (request, response) => {
  if (!ensureApiKey(response)) {
    return
  }

  const query = request.query.q?.trim()
  if (!query) {
    response.status(400).json({ error: 'Missing required query parameter: q' })
    return
  }

  try {
    const items = await searchYouTubeTracks(query, 12)

    if (request.user) {
      await updateUserState(request.user.id, {
        ...request.user.state,
        lastQuery: query,
        searchResults: items,
      })
    }

    response.json({ items })
  } catch (error) {
    response.status(502).json({
      error: normalizeYouTubeErrorMessage(
        error.message || 'Unexpected backend error while contacting YouTube.',
      ),
    })
  }
})

app.get('/api/home', async (request, response) => {
  if (!ensureApiKey(response)) {
    return
  }

  try {
    const [featuredCollections, sections] = await Promise.all([
      Promise.all(FEATURED_COLLECTIONS.map((collection) => buildCollection(collection, 6))),
      Promise.all(
        HOME_SECTIONS.map(async (section) => ({
          id: section.id,
          title: section.title,
          subtitle: section.subtitle,
          tracks: await searchYouTubeTracks(section.query, 5),
        })),
      ),
    ])

    const recentTracks = request.user?.state?.recentlyPlayed ?? []

    response.json({
      appName: 'SoundSphere',
      featuredCollections,
      sections: recentTracks.length
        ? [
            {
              id: 'recently-played',
              title: 'Recently played',
              subtitle: 'Your SoundSphere history comes back whenever you sign in.',
              tracks: recentTracks.slice(0, 5),
            },
            ...sections,
          ]
        : sections,
    })
  } catch (error) {
    response.status(502).json({
      error: normalizeYouTubeErrorMessage(
        error.message || 'Unable to build SoundSphere home sections.',
      ),
    })
  }
})

export { app }
