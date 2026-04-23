import { HiEllipsisHorizontal, HiHeart } from 'react-icons/hi2'
import { usePlayer } from '../context/PlayerContext.jsx'
import { formatDuration } from '../lib/formatters.js'

export function RightRail() {
  const { state, clearQueue, isTrackLiked, playQueueTrack, toggleLike } = usePlayer()
  const { currentTrack, currentTime, duration, queue } = state
  const currentTrackLiked = currentTrack ? isTrackLiked(currentTrack.id) : false

  return (
    <aside className="right-rail">
      <div className="rail-header">
        <h2>Now Playing</h2>
        <button type="button" className="icon-chip" aria-label="More actions">
          <HiEllipsisHorizontal size={18} />
        </button>
      </div>

      <div className="rail-current">
        {currentTrack ? (
          <>
            <img className="rail-cover" src={currentTrack.thumbnail} alt={currentTrack.title} />
            <div className="rail-meta">
              <div>
                <strong>{currentTrack.title}</strong>
                <small>{currentTrack.channelTitle}</small>
              </div>
              <button
                type="button"
                className={`favorite-chip ${currentTrackLiked ? 'active' : ''}`}
                aria-label={currentTrackLiked ? 'Remove from liked songs' : 'Add to liked songs'}
                onClick={() => toggleLike(currentTrack)}
              >
                <HiHeart size={16} />
              </button>
            </div>
            <div className="mini-progress">
              <div
                className="mini-progress-fill"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="mini-progress-meta">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </>
        ) : (
          <div className="right-rail-empty">
            <p>Select a track from SoundSphere to start the session.</p>
          </div>
        )}
      </div>

      <div className="rail-queue-header">
        <h3>Next in queue</h3>
        <button type="button" className="ghost-button small" onClick={clearQueue}>
          Clear
        </button>
      </div>

      <div className="rail-queue">
        {queue.map((track, index) => {
          const isActive = currentTrack?.id === track.id

          return (
            <button
              type="button"
              className={`rail-queue-item ${isActive ? 'active' : ''}`}
              key={`${track.id}-${index}`}
              onClick={() => playQueueTrack(index)}
            >
              <span className="rail-queue-index">{index + 1}</span>
              <img src={track.thumbnail} alt={track.title} />
              <span className="rail-queue-copy">
                <strong>{track.title}</strong>
                <small>{track.channelTitle}</small>
              </span>
              <span className="rail-queue-duration">
                {track.durationLabel ?? formatDuration(track.durationSec)}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
