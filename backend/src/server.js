import { initDatabase } from './db.js'
import { app } from './app.js'

const port = Number(process.env.PORT || 3001)

initDatabase()
  .then((connected) => {
    if (connected) {
      console.log('SoundSphere MySQL connection ready')
    } else {
      console.log('SoundSphere backend starting without MySQL configuration')
    }

    app.listen(port, () => {
      console.log(`SoundSphere backend listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize MySQL:', error.message)
    process.exit(1)
  })
