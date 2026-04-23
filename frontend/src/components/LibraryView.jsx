import { usePlayer } from '../context/PlayerContext.jsx'
import { HiHeart } from 'react-icons/hi2'

export function LibraryView() {
  const { playCollection, playRecentTrack, state, toggleLike, isTrackLiked } = usePlayer()

  return (
    <section className="tab-view">
      <div className="section-header">
        <div>
          <h2>Library</h2>
          <p>Your saved history and collection shortcuts live here.</p>
        </div>
      </div>

      <section className="music-section">
        <div className="section-header">
          <div>
            <h2>Recently Played</h2>
            <p>Pick up right where you left off.</p>
          </div>
        </div>
        <div className="track-card-grid">
          {state.recentlyPlayed.length > 0 ? (
            state.recentlyPlayed.map((track) => (
              <div key={track.id} className="track-card-wrapper">
                <button
                  type="button"
                  className="track-card"
                  onClick={() => playRecentTrack(track)}
                >
                  <div className="track-card-art">
                    <img src={track.thumbnail} alt={track.title} />
                  </div>
                  <strong>{track.title}</strong>
                  <small>{track.channelTitle}</small>
                  <span>{track.durationLabel ?? 'Recent favorite'}</span>
                </button>
                <button
                  type="button"
                  className={`track-card-like-btn ${isTrackLiked(track.id) ? 'liked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLike(track)
                  }}
                  title={isTrackLiked(track.id) ? 'Unlike' : 'Like'}
                >
                  <HiHeart size={20} />
                </button>
              </div>
            ))
          ) : (
            <p className="subtle-text">Your recent tracks will appear here after you listen.</p>
          )}
        </div>
      </section>

      <section className="music-section">
        <div className="section-header">
          <div>
            <h2>Playlist Saves</h2>
            <p>Tracks you added from the player page appear here.</p>
          </div>
        </div>
        <div className="track-card-grid">
          {state.savedPlaylistTracks.length > 0 ? (
            state.savedPlaylistTracks.map((track) => (
              <div key={`saved-${track.id}`} className="track-card-wrapper">
                <button
                  type="button"
                  className="track-card"
                  onClick={() => playRecentTrack(track)}
                >
                  <div className="track-card-art">
                    <img src={track.thumbnail} alt={track.title} />
                  </div>
                  <strong>{track.title}</strong>
                  <small>{track.channelTitle}</small>
                  <span>{track.durationLabel ?? 'Saved to playlist'}</span>
                </button>
                <button
                  type="button"
                  className={`track-card-like-btn ${isTrackLiked(track.id) ? 'liked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLike(track)
                  }}
                  title={isTrackLiked(track.id) ? 'Unlike' : 'Like'}
                >
                  <HiHeart size={20} />
                </button>
              </div>
            ))
          ) : (
            <p className="subtle-text">Use “Add to playlist” on the player page to save tracks here.</p>
          )}
        </div>
      </section>

      <section className="music-section">
        <div className="section-header">
          <div>
            <h2>Saved Collections</h2>
            <p>Fast access to the library cards from your home screen.</p>
          </div>
        </div>
        <div className="playlist-grid compact-grid">
          {state.featuredCollections.map((collection) => (
            <button
              type="button"
              className="playlist-card"
              key={collection.id}
              onClick={() => playCollection(collection, 0)}
            >
              <img src={collection.cover} alt={collection.title} />
              <strong>{collection.title}</strong>
              <small>{collection.subtitle}</small>
            </button>
          ))}
        </div>
      </section>
    </section>
  )
}
