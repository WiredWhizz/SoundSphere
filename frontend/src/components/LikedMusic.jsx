import { usePlayer } from '../context/PlayerContext.jsx'
import { HiTrash, HiHeart } from 'react-icons/hi2'

export function LikedMusic() {
  const { state, playLikedMusic, toggleLike } = usePlayer()

  const handlePlayLiked = () => {
    if (state.likedTracks.length > 0) {
      playLikedMusic(0)
    }
  }

  const handlePlayTrack = (index) => {
    playLikedMusic(index)
  }

  return (
    <section className="tab-view">
      <div className="section-header">
        <div>
          <h2>Liked Music</h2>
          <p>Your collection of favorite tracks.</p>
        </div>
        {state.likedTracks.length > 0 && (
          <button type="button" className="accent-button" onClick={handlePlayLiked}>
            Play All
          </button>
        )}
      </div>

      <section className="music-section">
        {state.likedTracks.length > 0 ? (
          <div className="track-list">
            {state.likedTracks.map((track, index) => (
              <div key={track.id} className="track-list-item">
                <button
                  type="button"
                  className="track-list-play-btn"
                  onClick={() => handlePlayTrack(index)}
                  title="Play track"
                >
                  <span className="track-number">{index + 1}</span>
                </button>
                <div className="track-list-art">
                  <img src={track.thumbnail} alt={track.title} />
                </div>
                <div className="track-list-info">
                  <strong>{track.title}</strong>
                  <small>{track.channelTitle}</small>
                </div>
                <button
                  type="button"
                  className="track-list-like-btn liked"
                  onClick={() => toggleLike(track)}
                  title="Remove from liked"
                >
                  <HiHeart size={18} />
                </button>
                <button
                  type="button"
                  className="track-list-remove-btn"
                  onClick={() => toggleLike(track)}
                  title="Remove from liked"
                >
                  <HiTrash size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="subtle-text">
            No liked tracks yet. Start liking your favorite songs to build your collection!
          </p>
        )}
      </section>
    </section>
  )
}
