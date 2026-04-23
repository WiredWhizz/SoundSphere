import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { getPool } from './db.js'

const scryptAsync = promisify(crypto.scrypt)

const defaultUserState = {
  queue: [],
  currentTrack: null,
  activeIndex: -1,
  volume: 80,
  shuffleEnabled: false,
  repeatMode: 'off',
  recentlyPlayed: [],
  likedTracks: [],
  savedPlaylistTracks: [],
  searchResults: [],
  lastQuery: '',
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(password, salt, 64)
  return `${salt}:${Buffer.from(derivedKey).toString('hex')}`
}

async function verifyPassword(password, storedHash) {
  const [salt, storedKey] = storedHash.split(':')
  if (!salt || !storedKey) {
    return false
  }

  const derivedKey = await scryptAsync(password, salt, 64)
  return crypto.timingSafeEqual(Buffer.from(storedKey, 'hex'), Buffer.from(derivedKey))
}

function createAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D1117&color=ffffff`
}

function normalizeRow(row) {
  if (!row) {
    return null
  }

  const parsedState =
    typeof row.player_state === 'string'
      ? JSON.parse(row.player_state)
      : row.player_state

  return {
    profile: {
      id: row.id,
      email: row.email,
      name: row.name,
      avatar: row.avatar,
      updatedAt: row.updated_at,
    },
    credentials: {
      passwordHash: row.password_hash,
    },
    state: {
      ...defaultUserState,
      ...(parsedState ?? {}),
    },
  }
}

export async function createLocalUser({ name, email, password }) {
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.')
  }

  const pool = await getPool()
  const normalizedEmail = email.toLowerCase()
  const [existingRows] = await pool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail],
  )

  if (existingRows.length > 0) {
    throw new Error('An account with that email already exists.')
  }

  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  const userRecord = {
    profile: {
      id,
      email: normalizedEmail,
      name,
      avatar: createAvatar(name),
    },
    credentials: {
      passwordHash,
    },
    state: {
      ...defaultUserState,
    },
  }

  await pool.execute(
    `
      INSERT INTO users (id, email, name, avatar, password_hash, player_state)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      userRecord.profile.id,
      userRecord.profile.email,
      userRecord.profile.name,
      userRecord.profile.avatar,
      userRecord.credentials.passwordHash,
      JSON.stringify(userRecord.state),
    ],
  )

  return userRecord
}

export async function getUserById(userId) {
  const pool = await getPool()
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [userId],
  )
  return normalizeRow(rows[0])
}

export async function getUserByEmail(email) {
  const pool = await getPool()
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email.toLowerCase()],
  )
  return normalizeRow(rows[0])
}

export async function updateUserState(userId, nextState) {
  const existingUser = await getUserById(userId)
  if (!existingUser) {
    return null
  }

  const mergedState = {
    ...defaultUserState,
    ...existingUser.state,
    ...nextState,
  }

  const pool = await getPool()
  await pool.execute(
    'UPDATE users SET player_state = ? WHERE id = ?',
    [JSON.stringify(mergedState), userId],
  )

  return {
    ...existingUser,
    state: mergedState,
  }
}

export { defaultUserState, verifyPassword }
