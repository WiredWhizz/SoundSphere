let youtubeIframeApiPromise

export function loadYouTubeIframeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }

  if (youtubeIframeApiPromise) {
    return youtubeIframeApiPromise
  }

  youtubeIframeApiPromise = new Promise((resolve, reject) => {
    const existingCallback = window.onYouTubeIframeAPIReady
    const existingScript = document.querySelector('script[data-youtube-iframe-api]')

    // The IFrame API expects a global callback named exactly
    // onYouTubeIframeAPIReady, so we install it once and resolve a shared
    // promise when the API is usable.
    window.onYouTubeIframeAPIReady = () => {
      if (typeof existingCallback === 'function') {
        existingCallback()
      }

      if (window.YT?.Player) {
        resolve(window.YT)
      } else {
        reject(new Error('YouTube iframe API loaded without the YT namespace.'))
      }
    }

    if (existingScript) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.dataset.youtubeIframeApi = 'true'
    script.onerror = () => reject(new Error('Unable to load the YouTube iframe API.'))
    document.body.appendChild(script)
  })

  return youtubeIframeApiPromise
}
