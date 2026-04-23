import {
  HiArrowsRightLeft,
  HiBackward,
  HiForward,
  HiHeart,
  HiPause,
  HiPlay,
  HiSpeakerWave,
} from 'react-icons/hi2'
import { usePlayer } from '../context/PlayerContext.jsx'
import { formatDuration } from '../lib/formatters.js'

function IconButton({ children, label, onClick, active = false, disabled = false }) {
  return (
    <button
      type="button"
      className={`icon-button${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function PlayerBar({ onPlayerOpen }) {
  const {
    state,
    cycleRepeatMode,
    isTrackLiked,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleLike,
    togglePlayPause,
    toggleShuffle,
  } = usePlayer()

  const {
    currentTrack,
    currentTime,
    duration,
    isPlayerReady,
    isPlaying,
    repeatMode,
    shuffleEnabled,
    volume,
  } = state

  const disabled = !currentTrack || !isPlayerReady

  return (
    <footer
      className={`player-bar${currentTrack ? ' player-bar-clickable' : ''}`}
      onClick={() => currentTrack && onPlayerOpen?.()}
      role={currentTrack ? 'button' : undefined}
      tabIndex={currentTrack ? 0 : undefined}
      onKeyDown={(event) => {
        if (!currentTrack) {
          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onPlayerOpen?.()
        }
      }}
      aria-label={currentTrack ? 'Open expanded player' : undefined}
    >
      <div className="player-bar-track player-bar-track-button">
        {currentTrack ? (
          <>
            <img src={currentTrack.thumbnail} alt={currentTrack.title} />
            <div className="player-bar-copy">
              <strong>{currentTrack.title}</strong>
              <small>{currentTrack.channelTitle}</small>
            </div>
            <button
              type="button"
              className={`favorite-chip player-bar-like ${isTrackLiked(currentTrack.id) ? 'active' : ''}`}
              onClick={(event) => {
                event.stopPropagation()
                toggleLike(currentTrack)
              }}
              aria-label={isTrackLiked(currentTrack.id) ? 'Unlike current track' : 'Like current track'}
            >
              <HiHeart size={16} />
            </button>
          </>
        ) : (
          <div className="player-bar-empty-copy">
            <strong>No track selected</strong>
            <small>Search and play a song to begin.</small>
          </div>
        )}
      </div>

      <div className="player-bar-center" onClick={(event) => event.stopPropagation()}>
        <div className="transport-row">
          <IconButton
            label="Toggle shuffle"
            onClick={toggleShuffle}
            active={shuffleEnabled}
          >
            <HiArrowsRightLeft size={18} />
          </IconButton>
          <IconButton label="Previous track" onClick={playPrevious} disabled={disabled}>
            <HiBackward size={18} />
          </IconButton>
          <button
            type="button"
            className="play-toggle"
            onClick={togglePlayPause}
            disabled={disabled}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <HiPause size={20} /> : <HiPlay size={20} />}
          </button>
          <IconButton label="Next track" onClick={playNext} disabled={disabled}>
            <HiForward size={18} />
          </IconButton>
          <IconButton
            label={`Repeat mode: ${repeatMode}`}
            onClick={cycleRepeatMode}
            active={repeatMode !== 'off'}
          >
            {repeatMode === 'one' ? '1' : 'R'}
          </IconButton>
        </div>

        <div className="timeline-row">
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
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <div className="player-bar-volume" onClick={(event) => event.stopPropagation()}>
        <label htmlFor="volume-slider">
          <HiSpeakerWave size={18} />
          <span>Volume</span>
        </label>
        <input
          id="volume-slider"
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          disabled={!isPlayerReady}
          aria-label="Adjust volume"
        />
      </div>
    </footer>
  )
}
