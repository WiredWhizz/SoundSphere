const PLAYER_STATE_KEY = 'soundsphere-player-state'

const defaultState = {
  queue: [],
  currentTrack: null,
  activeIndex: -1,
  volume: 80,
  shuffleEnabled: false,
  repeatMode: 'off',
  recentlyPlayed: [],
  likedTracks: [],
  savedPlaylistTracks: [],
}

export function loadPersistedPlayerState() {
  try {
    const rawValue = window.localStorage.getItem(PLAYER_STATE_KEY)
    if (!rawValue) {
      return defaultState
    }

    const parsedValue = JSON.parse(rawValue)
    return {
      ...defaultState,
      ...parsedValue,
    }
  } catch {
    return defaultState
  }
}

export function persistPlayerState(value) {
  try {
    window.localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(value))
  } catch {
    // Ignore storage quota failures and keep the player usable.
  }
}
