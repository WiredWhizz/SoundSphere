import mysql from 'mysql2/promise'

let pool

const USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar TEXT NULL,
    player_state JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`

function buildDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    const connectionUrl = new URL(process.env.DATABASE_URL)

    return {
      host: connectionUrl.hostname,
      port: Number(connectionUrl.port || 3306),
      user: decodeURIComponent(connectionUrl.username),
      password: decodeURIComponent(connectionUrl.password),
      database: connectionUrl.pathname.replace(/^\//, ''),
      ssl: process.env.MYSQL_SSL === 'false'
        ? undefined
        : { rejectUnauthorized: false },
    }
  }

  return {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: process.env.MYSQL_SSL === 'false'
      ? undefined
      : { rejectUnauthorized: false },
  }
}

export function hasDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    return true
  }

  const config = buildDatabaseConfig()
  return Boolean(config.host && config.user && config.database)
}

function createPoolConfig() {
  return {
    ...buildDatabaseConfig(),
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  }
}

export async function getPool() {
  if (!hasDatabaseConfig()) {
    throw new Error('Database is not configured. Set DATABASE_URL or MYSQL_* variables.')
  }

  if (!pool) {
    pool = mysql.createPool(createPoolConfig())
  }

  return pool
}

export async function initDatabase() {
  if (!hasDatabaseConfig()) {
    return false
  }

  const activePool = await getPool()
  await activePool.execute(USERS_TABLE_SQL)
  return true
}
