import { useEffect, useState } from 'react'
import { AuthScreen } from './components/AuthScreen.jsx'
import { ExploreView } from './components/ExploreView.jsx'
import { HomeSection } from './components/HomeSection.jsx'
import { LibraryView } from './components/LibraryView.jsx'
import { LikedMusic } from './components/LikedMusic.jsx'
import { PlayerBar } from './components/PlayerBar.jsx'
import { ExpandedPlayer } from './components/ExpandedPlayer.jsx'
import { ProfilePanel } from './components/ProfilePanel.jsx'
import { RightRail } from './components/RightRail.jsx'
import { SearchBar } from './components/SearchBar.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { usePlayer } from './context/PlayerContext.jsx'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'

function App() {
  const { status } = useAuth()
  const { bootstrap, playCollection, state } = usePlayer()
  const [activeTab, setActiveTab] = useState('home')
  const [profileOpen, setProfileOpen] = useState(false)
  const [playerExpanded, setPlayerExpanded] = useState(false)

  useKeyboardShortcuts()

  useEffect(() => {
    if (status === 'authenticated') {
      bootstrap()
    }
  }, [bootstrap, status])

  if (status === 'loading') {
    return <main className="auth-shell"><section className="auth-panel auth-panel-secondary"><p className="subtle-text">Loading SoundSphere...</p></section></main>
  }

  if (status !== 'authenticated') {
    return <AuthScreen />
  }

  return (
    <div className="sound-sphere-shell">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="center-stage">
        <SearchBar
          onOpenProfile={() => setProfileOpen(true)}
          onOpenResults={() => setActiveTab('explore')}
        />

        {activeTab === 'home' ? (
          <>
            <section className="hero-banner">
              <div>
                <p className="eyebrow">Let the music play</p>
                <h1>
                  Good <span>evening</span>
                </h1>
                <p className="hero-copy">
                  SoundSphere brings a hidden YouTube player under a polished music
                  app UI with smart queueing, playlists, and seamless playback.
                </p>
              </div>
              <div className="hero-actions">
                <button type="button" className="ghost-button" onClick={() => setActiveTab('explore')}>
                  Discover
                </button>
                <button type="button" className="accent-button">
                  Start Listening
                </button>
              </div>
            </section>

            <section className="playlist-grid">
              {state.homeStatus === 'loading'
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div className="playlist-card playlist-card-skeleton" key={`playlist-${index}`}>
                      <div className="skeleton-box playlist-art-skeleton" />
                      <div className="skeleton-box line-skeleton short" />
                      <div className="skeleton-box line-skeleton long" />
                    </div>
                  ))
                : state.featuredCollections.map((collection, index) => (
                    <button
                      type="button"
                      className={`playlist-card ${index === 0 ? 'playlist-card-featured' : ''}`}
                      key={collection.id}
                      onClick={() => playCollection(collection, 0)}
                    >
                      <img src={collection.cover} alt={collection.title} />
                      <strong>{collection.title}</strong>
                      <small>{collection.subtitle}</small>
                    </button>
                  ))}
            </section>

            {state.homeError ? <p className="error-copy">{state.homeError}</p> : null}

            <div className="home-sections">
              {state.homeSections.map((section) => (
                <HomeSection key={section.id} section={section} />
              ))}
            </div>
          </>
        ) : null}

        {activeTab === 'explore' ? <ExploreView /> : null}
        {activeTab === 'library' ? <LibraryView /> : null}
        {activeTab === 'liked' ? <LikedMusic /> : null}
      </main>

      <RightRail />
      <PlayerBar onPlayerOpen={() => setPlayerExpanded(true)} />
      <ExpandedPlayer isOpen={playerExpanded} onClose={() => setPlayerExpanded(false)} />
      {profileOpen ? <ProfilePanel onClose={() => setProfileOpen(false)} /> : null}
    </div>
  )
}

export default App
