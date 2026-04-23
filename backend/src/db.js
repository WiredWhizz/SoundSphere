import mysql from 'mysql2/promise'

let pool

function getDatabaseConfig() {
  return {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  }
}

function hasDatabaseConfig() {
  const config = getDatabaseConfig()
  return Boolean(config.host && config.user && config.database)
}

async function getPool() {
  if (!hasDatabaseConfig()) {
    throw new Error('MySQL is not configured. Set MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE.')
  }

  if (!pool) {
    const config = getDatabaseConfig()
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    })
  }

  return pool
}

async function initDatabase() {
  if (!hasDatabaseConfig()) {
    return false
  }

  const config = getDatabaseConfig()

  // Connect without selecting a database first so we can create it if needed.
  const bootstrapConnection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  })

  await bootstrapConnection.execute(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\``,
  )
  await bootstrapConnection.end()

  const activePool = await getPool()
  await activePool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      avatar TEXT NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      player_state JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  return true
}

export { getPool, hasDatabaseConfig, initDatabase }
