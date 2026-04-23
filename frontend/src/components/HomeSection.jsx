import { HiHeart } from 'react-icons/hi2'
import { usePlayer } from '../context/PlayerContext.jsx'
import { formatDuration } from '../lib/formatters.js'

export function HomeSection({ section }) {
  const { isTrackLiked, playCollection, toggleLike } = usePlayer()

  return (
    <section className="music-section">
      <div className="section-header">
        <div>
          <h2>{section.title}</h2>
          <p>{section.subtitle}</p>
        </div>
        <button type="button" className="ghost-button">
          See all
        </button>
      </div>

      <div className="track-card-grid">
        {section.tracks.map((track, index) => (
          <button
            type="button"
            className="track-card"
            key={`${section.id}-${track.id}`}
            onClick={() => playCollection(section, index)}
          >
            <div className="track-card-art">
              <img src={track.thumbnail} alt={track.title} />
            </div>
            <strong>{track.title}</strong>
            <small>{track.channelTitle}</small>
            <div className="track-card-meta">
              <span>{track.durationLabel ?? formatDuration(track.durationSec)}</span>
              <button
                type="button"
                className={`inline-like-button ${isTrackLiked(track.id) ? 'active' : ''}`}
                aria-label={isTrackLiked(track.id) ? 'Remove from liked songs' : 'Add to liked songs'}
                onClick={(event) => {
                  event.stopPropagation()
                  toggleLike(track)
                }}
              >
                <HiHeart size={16} />
              </button>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
