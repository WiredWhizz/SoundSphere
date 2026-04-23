import { useEffect } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'

export function useKeyboardShortcuts() {
  const { state, playNext, playPrevious, togglePlayPause } = usePlayer()

  useEffect(() => {
    function onKeyDown(event) {
      const tagName = document.activeElement?.tagName

      if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
        return
      }

      if (event.code === 'Space' && state.currentTrack) {
        event.preventDefault()
        togglePlayPause()
      }

      if (event.code === 'ArrowRight' && state.currentTrack) {
        event.preventDefault()
        playNext()
      }

      if (event.code === 'ArrowLeft' && state.currentTrack) {
        event.preventDefault()
        playPrevious()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [playNext, playPrevious, state.currentTrack, togglePlayPause])
}
