import { HiHeart } from 'react-icons/hi2'
import { usePlayer } from '../context/PlayerContext.jsx'
import { formatDuration } from '../lib/formatters.js'

export function ExploreView() {
  const { isTrackLiked, playCollection, playSearchResult, state, toggleLike } = usePlayer()

  return (
    <section className="tab-view">
      <div className="section-header">
        <div>
          <h2>Explore</h2>
          <p>Fresh picks from your recent searches and SoundSphere collections.</p>
        </div>
      </div>

      {state.searchResults.length > 0 ? (
        <section className="music-section">
          <div className="section-header">
            <div>
              <h2>Search Results</h2>
              <p>Browse your latest finds in a full-width list.</p>
            </div>
          </div>
          <div className="search-results-list">
            {state.searchResults.map((track, index) => (
              <div key={`${track.id}-${index}`} className="search-result-row">
                <button
                  type="button"
                  className="search-result-main"
                  onClick={() => playSearchResult(index)}
                >
                  <div className="search-result-art">
                    <img src={track.thumbnail} alt={track.title} />
                  </div>
                  <div className="search-result-copy">
                    <strong>{track.title}</strong>
                    <small>{track.channelTitle}</small>
                    <p>{track.description || 'Ready to play in SoundSphere.'}</p>
                  </div>
                </button>

                <span className="search-result-duration">
                  {track.durationLabel ?? formatDuration(track.durationSec)}
                </span>

                <button
                  type="button"
                  className={`search-result-like ${isTrackLiked(track.id) ? 'liked' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleLike(track)
                  }}
                  title={isTrackLiked(track.id) ? 'Unlike' : 'Like'}
                >
                  <HiHeart size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="music-section">
        <div className="section-header">
          <div>
            <h2>Featured Collections</h2>
            <p>Browse curated sets from the SoundSphere home feed.</p>
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
