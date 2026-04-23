import { useMemo, useState } from 'react'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import { useAuth } from '../context/AuthContext.jsx'
import { usePlayer } from '../context/PlayerContext.jsx'

export function SearchBar({ onOpenProfile, onOpenResults }) {
  const { playSearchResult, searchTracks, state } = usePlayer()
  const { user } = useAuth()
  const [query, setQuery] = useState('arijit singh')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions = useMemo(() => {
    if (!query.trim()) {
      return []
    }

    const lowerQuery = query.toLowerCase()
    const tasteTracks = state.homeSections.flatMap((section) => section.tracks ?? [])
    const querySuggestion = state.lastQuery
      ? [
          {
            id: `query-${state.lastQuery.toLowerCase()}`,
            title: state.lastQuery,
            channelTitle: 'Previous search',
            thumbnail: state.searchResults[0]?.thumbnail ?? '',
            suggestionType: 'query',
          },
        ]
      : []

    const combined = [
      ...querySuggestion,
      ...state.likedTracks.map((track) => ({ ...track, suggestionType: 'liked' })),
      ...state.recentlyPlayed.map((track) => ({ ...track, suggestionType: 'recent' })),
      ...tasteTracks.map((track) => ({ ...track, suggestionType: 'taste' })),
    ]

    const seen = new Set()
    const unique = combined.filter((track) => {
      if (seen.has(track.id)) {
        return false
      }

      seen.add(track.id)
      return true
    })

    return unique
      .filter(
        (track) =>
          track.title.toLowerCase().includes(lowerQuery) ||
          track.channelTitle.toLowerCase().includes(lowerQuery),
      )
      .slice(0, 8)
  }, [
    query,
    state.homeSections,
    state.lastQuery,
    state.likedTracks,
    state.recentlyPlayed,
    state.searchResults,
  ])

  function handleSubmit(event) {
    event.preventDefault()
    searchTracks(query)
    setShowSuggestions(false)
    onOpenResults?.()
  }

  function handleSuggestionClick(track) {
    if (track.suggestionType === 'query') {
      setQuery(track.title)
      searchTracks(track.title)
      setShowSuggestions(false)
      onOpenResults?.()
      return
    }

    const index = state.searchResults.findIndex((result) => result.id === track.id)
    if (index >= 0) {
      playSearchResult(index)
    } else {
      setQuery(track.title)
      searchTracks(track.title)
    }

    setShowSuggestions(false)
    onOpenResults?.()
  }

  return (
    <header className="search-header">
      <div className="search-container">
        <form className="search-shell" onSubmit={handleSubmit}>
          <span className="search-icon" aria-hidden="true">
            <HiMagnifyingGlass size={18} />
          </span>
          <input
            type="text"
            placeholder="Search songs, artists, albums..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            aria-label="Search songs, artists, albums"
          />
          <button type="submit" className="search-shortcut" aria-label="Search">
            {state.searchStatus === 'loading' ? '...' : 'K'}
          </button>
        </form>

        {showSuggestions && suggestions.length > 0 ? (
          <div className="search-suggestions">
            <div className="suggestions-section">
              <div className="suggestions-label">Suggestions</div>
              {suggestions.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(track)}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <div className="suggestion-art">
                    <img src={track.thumbnail} alt={track.title} />
                  </div>
                  <div className="suggestion-info">
                    <div className="suggestion-title">{track.title}</div>
                    <div className="suggestion-artist">
                      {track.channelTitle}
                      {track.suggestionType === 'liked' ? ' - Liked' : null}
                      {track.suggestionType === 'recent' ? ' - Recent' : null}
                      {track.suggestionType === 'taste' ? ' - Recommended' : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="search-actions-bar">
        <button type="button" className="icon-chip" aria-label="Home">
          H
        </button>
        {user?.avatar ? (
          <button
            type="button"
            className="profile-avatar-button"
            onClick={onOpenProfile}
            aria-label="Open profile"
          >
            <img className="profile-avatar" src={user.avatar} alt={user.name} />
          </button>
        ) : (
          <button
            type="button"
            className="profile-chip"
            aria-label="Profile"
            onClick={onOpenProfile}
          >
            SS
          </button>
        )}
      </div>

      {state.searchError ? <p className="error-copy">{state.searchError}</p> : null}
    </header>
  )
}
