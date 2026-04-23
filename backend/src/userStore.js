import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { getPool } from './db.js'

export const defaultUserState = {
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
      createdAt: row.created_at,
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

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, storedHash) {
  return bcrypt.compare(password, storedHash)
}

export async function createUser({ email, password, name }) {
  if (!email || !password) {
    throw new Error('Email and password are required.')
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.')
  }

  const pool = await getPool()
  const normalizedEmail = email.trim().toLowerCase()
  const displayName = name?.trim() || normalizedEmail.split('@')[0]
  const [existingRows] = await pool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail],
  )

  if (existingRows.length > 0) {
    throw new Error('An account with that email already exists.')
  }

  const userId = crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  const state = { ...defaultUserState }

  await pool.execute(
    `
      INSERT INTO users (id, email, password_hash, name, avatar, player_state)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      normalizedEmail,
      passwordHash,
      displayName,
      createAvatar(displayName),
      JSON.stringify(state),
    ],
  )

  return getUserById(userId)
}

export async function getUserById(userId) {
  const pool = await getPool()
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId])
  return normalizeRow(rows[0])
}

export async function getUserByEmail(email) {
  const pool = await getPool()
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [
    email.trim().toLowerCase(),
  ])
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
  await pool.execute('UPDATE users SET player_state = ? WHERE id = ?', [
    JSON.stringify(mergedState),
    userId,
  ])

  return {
    ...existingUser,
    state: mergedState,
  }
}
