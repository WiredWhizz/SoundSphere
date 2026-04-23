import { useMemo, useState } from 'react'
import {
  HiArrowsRightLeft,
  HiBackward,
  HiBars3BottomLeft,
  HiBell,
  HiChevronDown,
  HiEllipsisHorizontal,
  HiForward,
  HiHeart,
  HiListBullet,
  HiMagnifyingGlass,
  HiPause,
  HiPlay,
  HiPlus,
  HiQueueList,
  HiShare,
  HiSignal,
  HiSpeakerWave,
} from 'react-icons/hi2'
import { usePlayer } from '../context/PlayerContext.jsx'
import { formatDuration } from '../lib/formatters.js'

function IconButton({ children, label, onClick, active = false, disabled = false, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : ''

  return (
    <button
      type="button"
      className={`expanded-icon-button ${sizeClass}${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function ExpandedPlayer({ isOpen, onClose }) {
  const {
    state,
    addTrackToPlaylist,
    cycleRepeatMode,
    isTrackLiked,
    playNext,
    playPrevious,
    playQueueTrack,
    playSearchResult,
    searchTracks,
    seekTo,
    setVolume,
    toggleLike,
    togglePlayPause,
    toggleShuffle,
  } = usePlayer()
  const [playerQuery, setPlayerQuery] = useState('')
  const [showPlayerResults, setShowPlayerResults] = useState(false)
  const [playlistMessage, setPlaylistMessage] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const {
    activeIndex,
    currentTime,
    currentTrack,
    duration,
    isPlayerReady,
    isPlaying,
    queue,
    repeatMode,
    searchResults,
    searchStatus,
    shuffleEnabled,
    volume,
  } = state

  const disabled = !currentTrack || !isPlayerReady
  const shareUrl = currentTrack ? `https://www.youtube.com/watch?v=${currentTrack.id}` : ''
  const playerSearchResults = useMemo(
    () => searchResults.slice(0, 6),
    [searchResults],
  )

  if (!isOpen) {
    return null
  }

  async function handlePlayerSearchSubmit(event) {
    event.preventDefault()
    if (!playerQuery.trim()) {
      return
    }

    await searchTracks(playerQuery)
    setShowPlayerResults(true)
  }

  function handleAddToPlaylist() {
    if (!currentTrack) {
      return
    }

    const added = addTrackToPlaylist(currentTrack)
    setPlaylistMessage(added ? 'Saved to Library playlist.' : 'Already saved in Library.')
    window.setTimeout(() => setPlaylistMessage(''), 1800)
  }

  async function handleCopyShareLink() {
    if (!shareUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="expanded-player-overlay" onClick={onClose}>
      <div className="expanded-player-modal expanded-player-page" onClick={(event) => event.stopPropagation()}>
        <header className="expanded-player-topbar">
          <div className="expanded-topbar-search-wrap">
            <form className="expanded-topbar-search" onSubmit={handlePlayerSearchSubmit}>
              <HiMagnifyingGlass size={18} />
              <input
                type="text"
                value={playerQuery}
                onChange={(event) => {
                  setPlayerQuery(event.target.value)
                  setShowPlayerResults(false)
                }}
                placeholder="Search songs, albums, artists, podcasts..."
                aria-label="Search tracks from player page"
              />
              <button type="submit" className="expanded-page-chip expanded-search-chip" aria-label="Search from player page">
                {searchStatus === 'loading' ? '...' : 'Go'}
              </button>
            </form>

            {showPlayerResults && playerSearchResults.length > 0 ? (
              <div className="expanded-search-results-popout">
                {playerSearchResults.map((track, index) => (
                  <button
                    type="button"
                    key={`player-search-${track.id}`}
                    className="expanded-search-result-item"
                    onClick={() => {
                      playSearchResult(index)
                      setShowPlayerResults(false)
                    }}
                  >
                    <img src={track.thumbnail} alt={track.title} />
                    <span>
                      <strong>{track.title}</strong>
                      <small>{track.channelTitle}</small>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="expanded-topbar-actions">
            <button type="button" className="expanded-page-chip" aria-label="Shortcuts">K</button>
            <button type="button" className="expanded-page-chip" aria-label="Notifications">
              <HiBell size={18} />
            </button>
            <button type="button" className="expanded-page-chip" aria-label="Listening activity">
              <HiSignal size={18} />
            </button>
            <button
              type="button"
              className="expanded-page-chip"
              onClick={onClose}
              aria-label="Collapse player"
            >
              <HiChevronDown size={18} />
            </button>
          </div>
        </header>

        {currentTrack ? (
          <div className="expanded-player-shell">
            <section className="expanded-player-hero">
              <div className="expanded-player-art-panel">
                <div className="expanded-player-artwork expanded-player-artwork-framed">
                  <img src={currentTrack.thumbnail} alt={currentTrack.title} />
                </div>
              </div>

              <div className="expanded-player-info">
                <div className="expanded-player-copy expanded-player-copy-stack">
                  <p className="expanded-player-kicker">Playing from</p>
                  <strong className="expanded-player-source">SoundSphere</strong>
                  <h1>{currentTrack.title}</h1>
                  <p className="expanded-player-artist">{currentTrack.channelTitle}</p>
                </div>

                <div className="expanded-player-actions">
                  <button
                    type="button"
                    className={`favorite-btn${isTrackLiked(currentTrack.id) ? ' liked' : ''}`}
                    onClick={() => toggleLike(currentTrack)}
                    aria-label={isTrackLiked(currentTrack.id) ? 'Unlike track' : 'Like track'}
                  >
                    <HiHeart size={20} />
                  </button>
                  <button type="button" className="expanded-action-pill" onClick={handleAddToPlaylist}>
                    <HiPlus size={18} />
                    <span>Add to playlist</span>
                  </button>
                  <button
                    type="button"
                    className="expanded-page-chip"
                    aria-label="Share"
                    onClick={() => setShareOpen((current) => !current)}
                  >
                    <HiShare size={18} />
                  </button>
                  <button type="button" className="expanded-page-chip" aria-label="More options">
                    <HiEllipsisHorizontal size={18} />
                  </button>
                </div>

                {playlistMessage ? <p className="expanded-inline-message">{playlistMessage}</p> : null}

                {shareOpen ? (
                  <div className="expanded-share-popout">
                    <p>Share this YouTube video</p>
                    <code>{shareUrl}</code>
                    <button type="button" className="expanded-action-pill" onClick={handleCopyShareLink}>
                      <span>{copied ? 'Copied' : 'Copy link'}</span>
                    </button>
                  </div>
                ) : null}

                <div className="expanded-player-progress expanded-player-progress-wide">
                  <div className="timeline-row full-width">
                    <span className="time-label">{formatDuration(currentTime)}</span>
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={Math.min(currentTime, duration || 0)}
                      onChange={(event) => seekTo(Number(event.target.value))}
                      disabled={disabled || !duration}
                      aria-label="Seek through current track"
                      className="expanded-progress-slider"
                    />
                    <span className="time-label">{formatDuration(duration)}</span>
                  </div>
                </div>

                <div className="expanded-controls expanded-controls-centered">
                  <div className="transport-controls transport-controls-wide">
                    <IconButton
                      label="Toggle shuffle"
                      onClick={toggleShuffle}
                      active={shuffleEnabled}
                    >
                      <HiArrowsRightLeft size={20} />
                    </IconButton>
                    <IconButton label="Previous track" onClick={playPrevious} disabled={disabled}>
                      <HiBackward size={20} />
                    </IconButton>
                    <button
                      type="button"
                      className="play-toggle expanded"
                      onClick={togglePlayPause}
                      disabled={disabled}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <HiPause size={26} /> : <HiPlay size={26} />}
                    </button>
                    <IconButton label="Next track" onClick={playNext} disabled={disabled}>
                      <HiForward size={20} />
                    </IconButton>
                    <IconButton
                      label={`Repeat mode: ${repeatMode}`}
                      onClick={cycleRepeatMode}
                      active={repeatMode !== 'off'}
                    >
                      {repeatMode === 'one' ? '1' : 'R'}
                    </IconButton>
                  </div>

                  <div className="expanded-volume-row">
                    <HiSpeakerWave size={20} />
                    <input
                      id="expanded-volume"
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(event) => setVolume(Number(event.target.value))}
                      disabled={!isPlayerReady}
                      aria-label="Adjust volume"
                      className="volume-slider"
                    />
                    <span className="volume-value">{volume}%</span>
                    <HiSignal size={18} />
                  </div>

                  <div className="expanded-footer-tabs">
                    <button type="button" className="expanded-tab-pill">Lyrics</button>
                    <button type="button" className="expanded-tab-pill">Video</button>
                    <button type="button" className="expanded-tab-pill">Related</button>
                  </div>
                </div>
              </div>
            </section>

            <aside className="expanded-player-sidebar">
              <div className="expanded-sidebar-header">
                <div>
                  <small>Up Next</small>
                  <h3>Queue</h3>
                </div>
                <div className="expanded-sidebar-badge">
                  <HiListBullet size={18} />
                  <span>{queue.length}</span>
                </div>
              </div>

              <div className="expanded-queue-list">
                {queue.map((track, index) => {
                  const isActive = activeIndex === index

                  return (
                    <button
                      type="button"
                      className={`expanded-queue-item ${isActive ? 'active' : ''}`}
                      key={`${track.id}-${index}`}
                      onClick={() => playQueueTrack(index)}
                    >
                      <span className="expanded-queue-index">{index + 1}</span>
                      <img src={track.thumbnail} alt={track.title} />
                      <span className="expanded-queue-copy">
                        <strong>{track.title}</strong>
                        <small>{track.channelTitle}</small>
                      </span>
                      <span className="expanded-queue-duration">
                        {track.durationLabel ?? formatDuration(track.durationSec)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </aside>

            <footer className="expanded-player-dock">
              <div className="expanded-dock-track">
                <img src={currentTrack.thumbnail} alt={currentTrack.title} />
                <div>
                  <strong>{currentTrack.title}</strong>
                  <small>{currentTrack.channelTitle}</small>
                </div>
                <button
                  type="button"
                  className={`favorite-chip player-bar-like ${isTrackLiked(currentTrack.id) ? 'active' : ''}`}
                  onClick={() => toggleLike(currentTrack)}
                  aria-label={isTrackLiked(currentTrack.id) ? 'Unlike current track' : 'Like current track'}
                >
                  <HiHeart size={16} />
                </button>
              </div>

              <div className="expanded-dock-center">
                <div className="transport-row">
                  <IconButton
                    label="Toggle shuffle"
                    onClick={toggleShuffle}
                    active={shuffleEnabled}
                    size="sm"
                  >
                    <HiArrowsRightLeft size={18} />
                  </IconButton>
                  <IconButton label="Previous track" onClick={playPrevious} disabled={disabled} size="sm">
                    <HiBackward size={18} />
                  </IconButton>
                  <button
                    type="button"
                    className="play-toggle expanded-dock-play"
                    onClick={togglePlayPause}
                    disabled={disabled}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <HiPause size={22} /> : <HiPlay size={22} />}
                  </button>
                  <IconButton label="Next track" onClick={playNext} disabled={disabled} size="sm">
                    <HiForward size={18} />
                  </IconButton>
                  <IconButton
                    label={`Repeat mode: ${repeatMode}`}
                    onClick={cycleRepeatMode}
                    active={repeatMode !== 'off'}
                    size="sm"
                  >
                    {repeatMode === 'one' ? '1' : 'R'}
                  </IconButton>
                </div>

                <div className="timeline-row expanded-dock-timeline">
                  <span>{formatDuration(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={Math.min(currentTime, duration || 0)}
                    onChange={(event) => seekTo(Number(event.target.value))}
                    disabled={disabled || !duration}
                    aria-label="Seek through current track"
                  />
                  <span>{`${formatDuration(currentTime)} / ${formatDuration(duration)}`}</span>
                </div>
              </div>

              <div className="expanded-dock-volume">
                <HiSpeakerWave size={20} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  disabled={!isPlayerReady}
                  aria-label="Adjust volume"
                />
                <HiQueueList size={20} />
              </div>
            </footer>
          </div>
        ) : (
          <div className="expanded-player-empty">
            <p>Select a track to start playing music</p>
          </div>
        )}
      </div>
    </div>
  )
}
