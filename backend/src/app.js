import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { hasDatabaseConfig } from './db.js'
import { optionalAuth, requireAuth } from './middleware/authMiddleware.js'
import { authRoutes } from './routes/authRoutes.js'
import { defaultUserState, updateUserState } from './userStore.js'

dotenv.config()

const app = express()
const API_KEY = process.env.YOUTUBE_API_KEY

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

function resolveAllowedOrigins() {
  return [
    process.env.CORS_ORIGIN,
    process.env.VERCEL_FRONTEND_URL,
    process.env.FRONTEND_ORIGIN,
  ]
    .flatMap((value) => (value ? value.split(',') : []))
    .map((value) => value.trim())
    .filter(Boolean)
}

const allowedOrigins = resolveAllowedOrigins()

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origin not allowed by CORS.'))
    },
    credentials: false,
  }),
)
app.use(express.json())
app.use('/api', limiter)
app.use(optionalAuth)
app.use('/api/auth', authRoutes)

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    app: 'SoundSphere',
    auth: 'jwt',
    databaseConfigured: hasDatabaseConfig(),
  })
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
    error: 'Database is not configured. Set DATABASE_URL or MYSQL_* variables.',
  })
  return false
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

app.get('/api/user/state', requireAuth, (request, response) => {
  if (!ensureDatabase(response)) {
    return
  }

  response.json({ state: request.user.state })
})

app.put('/api/user/state', optionalAuth, async (request, response) => {
  if (!ensureDatabase(response)) {
    return
  }

  // If no authenticated user, just return default state without saving
  if (!request.user) {
    response.json({ state: defaultUserState })
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
