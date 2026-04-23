/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import { useAuth } from './AuthContext.jsx'
import { loadPersistedPlayerState, persistPlayerState } from '../lib/storage.js'
import { loadYouTubeIframeApi } from '../lib/youtubeIframeApi.js'

const PlayerContext = createContext(null)
const DEFAULT_SEARCH = 'arijit singh'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const REPEAT_MODES = ['off', 'all', 'one']
const persistedState = loadPersistedPlayerState()

const initialState = {
  currentTrack: persistedState.currentTrack,
  queue: persistedState.queue,
  searchResults: [],
  featuredCollections: [],
  homeSections: [],
  recentlyPlayed: persistedState.recentlyPlayed,
  likedTracks: persistedState.likedTracks,
  savedPlaylistTracks: persistedState.savedPlaylistTracks,
  isPlaying: false,
  isPlayerReady: false,
  progress: 0,
  currentTime: 0,
  duration: 0,
  volume: persistedState.volume,
  shuffleEnabled: persistedState.shuffleEnabled,
  repeatMode: persistedState.repeatMode,
  searchStatus: 'idle',
  searchError: '',
  homeStatus: 'idle',
  homeError: '',
  activeIndex: persistedState.activeIndex,
  lastQuery: '',
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_USER_STATE':
      return {
        ...state,
        queue: action.payload.queue ?? state.queue,
        currentTrack: action.payload.currentTrack ?? state.currentTrack,
        activeIndex: action.payload.activeIndex ?? state.activeIndex,
        volume: action.payload.volume ?? state.volume,
        shuffleEnabled: action.payload.shuffleEnabled ?? state.shuffleEnabled,
        repeatMode: action.payload.repeatMode ?? state.repeatMode,
        recentlyPlayed: action.payload.recentlyPlayed ?? state.recentlyPlayed,
        likedTracks: action.payload.likedTracks ?? state.likedTracks,
        savedPlaylistTracks: action.payload.savedPlaylistTracks ?? state.savedPlaylistTracks,
        searchResults: action.payload.searchResults ?? state.searchResults,
        lastQuery: action.payload.lastQuery ?? state.lastQuery,
      }
    case 'PLAYER_READY':
      return { ...state, isPlayerReady: true }
    case 'SEARCH_START':
      return { ...state, searchStatus: 'loading', searchError: '' }
    case 'SEARCH_SUCCESS':
      return {
        ...state,
        searchStatus: 'success',
        searchResults: action.payload.items,
        searchError: '',
        lastQuery: action.payload.query,
      }
    case 'SEARCH_ERROR':
      return { ...state, searchStatus: 'error', searchError: action.payload }
    case 'HOME_START':
      return { ...state, homeStatus: 'loading', homeError: '' }
    case 'HOME_SUCCESS':
      return {
        ...state,
        homeStatus: 'success',
        featuredCollections: action.payload.featuredCollections,
        homeSections: action.payload.sections,
      }
    case 'HOME_ERROR':
      return { ...state, homeStatus: 'error', homeError: action.payload }
    case 'SET_QUEUE_AND_TRACK':
      return {
        ...state,
        queue: action.payload.queue,
        currentTrack: action.payload.track,
        activeIndex: action.payload.index,
      }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload }
    case 'SET_PROGRESS':
      return {
        ...state,
        currentTime: action.payload.currentTime,
        duration: action.payload.duration,
        progress: action.payload.duration
          ? action.payload.currentTime / action.payload.duration
          : 0,
      }
    case 'SET_VOLUME':
      return { ...state, volume: action.payload }
    case 'SET_SHUFFLE':
      return { ...state, shuffleEnabled: !state.shuffleEnabled }
    case 'SET_REPEAT_MODE': {
      const currentIndex = REPEAT_MODES.indexOf(state.repeatMode)
      return {
        ...state,
        repeatMode: REPEAT_MODES[(currentIndex + 1) % REPEAT_MODES.length],
      }
    }
    case 'SET_RECENTLY_PLAYED':
      return { ...state, recentlyPlayed: action.payload }
    case 'TOGGLE_LIKE':
      return {
        ...state,
        likedTracks: state.likedTracks.find((track) => track.id === action.payload.id)
          ? state.likedTracks.filter((track) => track.id !== action.payload.id)
          : [action.payload, ...state.likedTracks],
      }
    case 'ADD_TO_PLAYLIST':
      return {
        ...state,
        savedPlaylistTracks: state.savedPlaylistTracks.find((track) => track.id === action.payload.id)
          ? state.savedPlaylistTracks
          : [action.payload, ...state.savedPlaylistTracks],
      }
    case 'CLEAR_QUEUE':
      return {
        ...state,
        queue: state.currentTrack ? [state.currentTrack] : [],
        activeIndex: state.currentTrack ? 0 : -1,
      }
    default:
      return state
  }
}

function dedupeTracks(tracks) {
  return tracks.filter(
    (track, index, list) => list.findIndex((candidate) => candidate.id === track.id) === index,
  )
}

function updateRecentList(list, track) {
  return [track, ...list.filter((item) => item.id !== track.id)].slice(0, 8)
}

export function PlayerProvider({ children }) {
  const { consumeSavedState, status } = useAuth()
  const [state, dispatch] = useReducer(reducer, initialState)
  const playerRef = useRef(null)
  const progressIntervalRef = useRef(null)
  const initializedRef = useRef(false)
  const lastLoadedTrackIdRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  const syncProgress = useCallback(() => {
    const player = playerRef.current

    if (!player || typeof player.getCurrentTime !== 'function') {
      return
    }

    dispatch({
      type: 'SET_PROGRESS',
      payload: {
        currentTime: player.getCurrentTime() || 0,
        duration: player.getDuration() || 0,
      },
    })
  }, [])

  const clearProgressTimer = useCallback(() => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  const startProgressTimer = useCallback(() => {
    clearProgressTimer()
    progressIntervalRef.current = window.setInterval(syncProgress, 500)
  }, [clearProgressTimer, syncProgress])

  const updateRecentlyPlayed = useCallback((track) => {
    if (!track) {
      return
    }

    dispatch({
      type: 'SET_RECENTLY_PLAYED',
      payload: updateRecentList(state.recentlyPlayed, track),
    })
  }, [state.recentlyPlayed])

  const loadTrackIntoPlayer = useCallback((track, { autoplay = true, seekTo = 0 } = {}) => {
    const player = playerRef.current

    if (!player || !track) {
      return
    }

    lastLoadedTrackIdRef.current = track.id

    if (autoplay) {
      player.loadVideoById({ videoId: track.id, startSeconds: seekTo })
    } else {
      player.cueVideoById({ videoId: track.id, startSeconds: seekTo })
    }
  }, [])

  const setQueueAndPlay = useCallback((queue, index = 0, autoplay = true) => {
    const nextTrack = queue[index]

    if (!nextTrack) {
      return
    }

    dispatch({
      type: 'SET_QUEUE_AND_TRACK',
      payload: { queue, track: nextTrack, index },
    })
    updateRecentlyPlayed(nextTrack)

    if (playerRef.current) {
      loadTrackIntoPlayer(nextTrack, { autoplay })
      if (!autoplay) {
        dispatch({ type: 'SET_PLAYING', payload: false })
      }
    }
  }, [loadTrackIntoPlayer, updateRecentlyPlayed])

  const getNextIndex = useCallback((step = 1) => {
    if (state.queue.length === 0) {
      return -1
    }

    if (state.shuffleEnabled && state.queue.length > 1) {
      let randomIndex = state.activeIndex

      while (randomIndex === state.activeIndex) {
        randomIndex = Math.floor(Math.random() * state.queue.length)
      }

      return randomIndex
    }

    const nextIndex = state.activeIndex + step

    if (nextIndex < 0) {
      return state.repeatMode === 'all' ? state.queue.length - 1 : 0
    }

    if (nextIndex >= state.queue.length) {
      return state.repeatMode === 'all' ? 0 : state.queue.length - 1
    }

    return nextIndex
  }, [state.activeIndex, state.queue.length, state.repeatMode, state.shuffleEnabled])

  const playQueueTrack = useCallback((index) => {
    setQueueAndPlay(state.queue, index, true)
  }, [setQueueAndPlay, state.queue])

  const playCollection = useCallback((collection, index = 0) => {
    setQueueAndPlay(collection.tracks, index, true)
  }, [setQueueAndPlay])

  const playSearchResult = useCallback((index) => {
    setQueueAndPlay(state.searchResults, index, true)
  }, [setQueueAndPlay, state.searchResults])

  const playRecentTrack = useCallback((track) => {
    const existingIndex = state.queue.findIndex((item) => item.id === track.id)

    if (existingIndex >= 0) {
      setQueueAndPlay(state.queue, existingIndex, true)
      return
    }

    setQueueAndPlay([track, ...state.queue], 0, true)
  }, [setQueueAndPlay, state.queue])

  const playNext = useCallback(() => {
    if (state.repeatMode === 'one' && playerRef.current) {
      playerRef.current.seekTo(0, true)
      playerRef.current.playVideo()
      return
    }

    const nextIndex = getNextIndex(1)
    if (nextIndex < 0) {
      return
    }

    if (nextIndex === state.activeIndex && state.repeatMode === 'off') {
      dispatch({ type: 'SET_PLAYING', payload: false })
      return
    }

    setQueueAndPlay(state.queue, nextIndex, true)
  }, [getNextIndex, setQueueAndPlay, state.activeIndex, state.queue, state.repeatMode])

  const playPrevious = useCallback(() => {
    if (state.currentTime > 3 && playerRef.current) {
      playerRef.current.seekTo(0, true)
      return
    }

    const previousIndex = getNextIndex(-1)
    if (previousIndex >= 0) {
      setQueueAndPlay(state.queue, previousIndex, true)
    }
  }, [getNextIndex, setQueueAndPlay, state.currentTime, state.queue])

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current
    if (!player || !state.currentTrack) {
      return
    }

    if (state.isPlaying) {
      player.pauseVideo()
      dispatch({ type: 'SET_PLAYING', payload: false })
    } else {
      player.playVideo()
      dispatch({ type: 'SET_PLAYING', payload: true })
    }
  }, [state.currentTrack, state.isPlaying])

  const seekTo = useCallback((seconds) => {
    const player = playerRef.current
    if (!player || !Number.isFinite(seconds)) {
      return
    }

    player.seekTo(seconds, true)
    syncProgress()
  }, [syncProgress])

  const setVolume = useCallback((nextVolume) => {
    const safeVolume = Math.max(0, Math.min(100, nextVolume))

    if (playerRef.current) {
      playerRef.current.setVolume(safeVolume)
    }

    dispatch({ type: 'SET_VOLUME', payload: safeVolume })
  }, [])

  const searchTracks = useCallback(async (query) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      dispatch({ type: 'SEARCH_ERROR', payload: 'Enter a song, artist, or album first.' })
      return
    }

    dispatch({ type: 'SEARCH_START' })

    try {
      const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'Search request failed.')
      }

      const payload = await response.json()
      const tracks = dedupeTracks(payload.items ?? [])
      startTransition(() => {
        dispatch({ type: 'SEARCH_SUCCESS', payload: { items: tracks, query: trimmedQuery } })
      })
    } catch (error) {
      dispatch({
        type: 'SEARCH_ERROR',
        payload: error.message || 'Unable to search right now.',
      })
    }
  }, [])

  const fetchHomeData = useCallback(async () => {
    dispatch({ type: 'HOME_START' })

    try {
      const response = await fetch(`${API_BASE_URL}/api/home`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'Unable to load SoundSphere sections.')
      }

      const payload = await response.json()
      dispatch({
        type: 'HOME_SUCCESS',
        payload: {
          featuredCollections: payload.featuredCollections ?? [],
          sections: payload.sections ?? [],
        },
      })

      if (!state.currentTrack && payload.sections?.[0]?.tracks?.length) {
        dispatch({
          type: 'SET_QUEUE_AND_TRACK',
          payload: {
            queue: payload.sections[0].tracks,
            track: payload.sections[0].tracks[0],
            index: 0,
          },
        })
      }
    } catch (error) {
      dispatch({
        type: 'HOME_ERROR',
        payload: error.message || 'Unable to load SoundSphere sections.',
      })
    }
  }, [state.currentTrack])

  const bootstrap = useCallback(async () => {
    if (initializedRef.current) {
      return
    }

    initializedRef.current = true

    try {
      const YT = await loadYouTubeIframeApi()
      playerRef.current = new YT.Player('youtube-hidden-player', {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            dispatch({ type: 'PLAYER_READY' })
            event.target.setVolume(state.volume)

            if (state.currentTrack) {
              loadTrackIntoPlayer(state.currentTrack, { autoplay: false })
            }
          },
          onStateChange: (event) => {
            switch (event.data) {
              case YT.PlayerState.PLAYING:
                dispatch({ type: 'SET_PLAYING', payload: true })
                syncProgress()
                startProgressTimer()
                break
              case YT.PlayerState.PAUSED:
                dispatch({ type: 'SET_PLAYING', payload: false })
                syncProgress()
                clearProgressTimer()
                break
              case YT.PlayerState.ENDED:
                dispatch({ type: 'SET_PLAYING', payload: false })
                clearProgressTimer()
                playNext()
                break
              default:
                break
            }
          },
        },
      })
    } catch (error) {
      dispatch({
        type: 'SEARCH_ERROR',
        payload: error.message || 'Failed to initialize the YouTube player.',
      })
    }

    fetchHomeData()
    searchTracks(DEFAULT_SEARCH)
  }, [clearProgressTimer, fetchHomeData, loadTrackIntoPlayer, playNext, searchTracks, startProgressTimer, state.currentTrack, state.volume, syncProgress])

  const toggleShuffle = useCallback(() => {
    dispatch({ type: 'SET_SHUFFLE' })
  }, [])

  const cycleRepeatMode = useCallback(() => {
    dispatch({ type: 'SET_REPEAT_MODE' })
  }, [])

  const clearQueue = useCallback(() => {
    dispatch({ type: 'CLEAR_QUEUE' })
  }, [])

  const toggleLike = useCallback((track) => {
    if (!track?.id) {
      return
    }

    dispatch({ type: 'TOGGLE_LIKE', payload: track })
  }, [])

  const playLikedMusic = useCallback((index = 0) => {
    if (state.likedTracks.length > 0) {
      setQueueAndPlay(state.likedTracks, index, true)
    }
  }, [setQueueAndPlay, state.likedTracks])

  const addTrackToPlaylist = useCallback((track) => {
    if (!track?.id) {
      return false
    }

    const alreadySaved = state.savedPlaylistTracks.some((item) => item.id === track.id)
    if (!alreadySaved) {
      dispatch({ type: 'ADD_TO_PLAYLIST', payload: track })
    }

    return !alreadySaved
  }, [state.savedPlaylistTracks])

  useEffect(() => {
    if (status !== 'authenticated') {
      return
    }

    const savedState = consumeSavedState()
    if (!savedState) {
      return
    }

    dispatch({ type: 'HYDRATE_USER_STATE', payload: savedState })
  }, [consumeSavedState, status])

  useEffect(() => {
    persistPlayerState({
      queue: state.queue,
      currentTrack: state.currentTrack,
      activeIndex: state.activeIndex,
      volume: state.volume,
      shuffleEnabled: state.shuffleEnabled,
      repeatMode: state.repeatMode,
      recentlyPlayed: state.recentlyPlayed,
      likedTracks: state.likedTracks,
      savedPlaylistTracks: state.savedPlaylistTracks,
    })
  }, [
    state.activeIndex,
    state.currentTrack,
    state.queue,
    state.recentlyPlayed,
    state.repeatMode,
    state.shuffleEnabled,
    state.volume,
    state.likedTracks,
    state.savedPlaylistTracks,
  ])

  useEffect(() => {
    if (status !== 'authenticated') {
      return
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      fetch(`${API_BASE_URL}/api/user/state`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: {
            queue: state.queue,
            currentTrack: state.currentTrack,
            activeIndex: state.activeIndex,
            volume: state.volume,
            shuffleEnabled: state.shuffleEnabled,
            repeatMode: state.repeatMode,
            recentlyPlayed: state.recentlyPlayed,
            likedTracks: state.likedTracks,
            savedPlaylistTracks: state.savedPlaylistTracks,
            searchResults: state.searchResults,
            lastQuery: state.lastQuery,
          },
        }),
      }).catch(() => null)
    }, 700)

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [
    state.activeIndex,
    state.currentTrack,
    state.lastQuery,
    state.queue,
    state.recentlyPlayed,
    state.repeatMode,
    state.searchResults,
    state.shuffleEnabled,
    state.volume,
    state.likedTracks,
    state.savedPlaylistTracks,
    status,
  ])

  useEffect(() => {
    if (!state.isPlayerReady || !state.currentTrack || !playerRef.current) {
      return
    }

    if (lastLoadedTrackIdRef.current === state.currentTrack.id) {
      return
    }

    loadTrackIntoPlayer(state.currentTrack, { autoplay: false })
  }, [loadTrackIntoPlayer, state.currentTrack, state.isPlayerReady])

  useEffect(() => clearProgressTimer, [clearProgressTimer])

  const value = useMemo(() => ({
    state,
    bootstrap,
    clearQueue,
    cycleRepeatMode,
    fetchHomeData,
    playCollection,
    playLikedMusic,
    playNext,
    playPrevious,
    playQueueTrack,
    playRecentTrack,
    playSearchResult,
    addTrackToPlaylist,
    searchTracks,
    seekTo,
    setVolume,
    togglePlayPause,
    toggleShuffle,
    toggleLike,
    isTrackLiked: (trackId) => state.likedTracks.some((track) => track.id === trackId),
  }), [
    bootstrap,
    clearQueue,
    cycleRepeatMode,
    fetchHomeData,
    playCollection,
    playLikedMusic,
    playNext,
    playPrevious,
    playQueueTrack,
    playRecentTrack,
    playSearchResult,
    addTrackToPlaylist,
    searchTracks,
    seekTo,
    setVolume,
    state,
    togglePlayPause,
    toggleShuffle,
    toggleLike,
  ])

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div id="youtube-hidden-player" className="youtube-hidden-player" aria-hidden="true" />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)

  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider.')
  }

  return context
}
