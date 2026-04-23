import {
  HiHeart,
  HiHome,
  HiMagnifyingGlass,
  HiRectangleStack,
} from 'react-icons/hi2'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const menuItems = [
  { label: 'Home', icon: HiHome },
  { label: 'Explore', icon: HiMagnifyingGlass },
  { label: 'Library', icon: HiRectangleStack },
  { label: 'Liked', icon: HiHeart },
]

export function Sidebar({ activeTab, onTabChange }) {
  const { state } = usePlayer()
  const { logout, user } = useAuth()

  return (
    <aside className="sidebar">
      <button
        type="button"
        className="brand brand-button"
        onClick={() => onTabChange('home')}
        aria-label="Go to home page"
      >
        <div className="brand-mark">SS</div>
        <div>
          <strong>SoundSphere</strong>
          <small>{user?.name ?? 'Your music hub'}</small>
        </div>
      </button>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon
          const tabKey = item.label.toLowerCase()

          return (
            <button
              type="button"
              key={item.label}
              className={`nav-item ${activeTab === tabKey ? 'active' : ''}`}
              onClick={() => onTabChange(tabKey)}
            >
              <span className="nav-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <span className="nav-label">{item.label}</span>
              <span className="nav-popout" aria-hidden="true">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      <section className="library-block">
        <p className="sidebar-label">Your Library</p>
        <div className="library-list">
          {state.featuredCollections.map((collection) => (
            <button type="button" className="library-item" key={collection.id}>
              <img src={collection.cover} alt={collection.title} />
              <span>
                <strong>{collection.title}</strong>
                <small>{collection.subtitle}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-promo">
        <h3>Take your music everywhere</h3>
        <p>Sync your queue and keep SoundSphere ready for your next session.</p>
        <button
          type="button"
          className="accent-button full"
          onClick={async () => {
            onTabChange('home')
            await logout()
          }}
        >
          Log out
        </button>
      </section>
    </aside>
  )
}
