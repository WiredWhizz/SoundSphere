import { useAuth } from '../context/AuthContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'

export function ProfilePanel({ onClose }) {
  const { user } = useAuth()
  const { state } = usePlayer()

  return (
    <div className="profile-overlay" onClick={onClose}>
      <section
        className="profile-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-panel-header">
          <h2>Your Profile</h2>
          <button type="button" className="icon-chip" onClick={onClose} aria-label="Close profile">
            X
          </button>
        </div>

        <div className="profile-summary">
          {user?.avatar ? <img className="profile-panel-avatar" src={user.avatar} alt={user.name} /> : null}
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </div>
        </div>

        <div className="profile-stats">
          <div>
            <strong>{state.recentlyPlayed.length}</strong>
            <span>Recently played</span>
          </div>
          <div>
            <strong>{state.queue.length}</strong>
            <span>Tracks in queue</span>
          </div>
          <div>
            <strong>{state.featuredCollections.length}</strong>
            <span>Collections</span>
          </div>
        </div>

        <div className="profile-card">
          <h3>Account Memory</h3>
          <p>
            Your SoundSphere account keeps your queue, search feed, and recent
            listening history ready each time you sign in.
          </p>
        </div>
      </section>
    </div>
  )
}
