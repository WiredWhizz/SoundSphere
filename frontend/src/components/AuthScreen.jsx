import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export function AuthScreen() {
  const { authError, login, signup, status } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (mode === 'signup') {
      await signup(form)
      return
    }

    await login({
      email: form.email,
      password: form.password,
    })
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel-primary">
        <p className="eyebrow">Sign in to continue</p>
        <h1>Welcome to SoundSphere</h1>
        <p className="auth-copy">
          Create a SoundSphere account and your music feed, recent plays, and
          search history will stay with you every time you return.
        </p>

        <div className="auth-bullets">
          <div>
            <strong>Personal feed</strong>
            <span>Your recently played tracks return after sign in.</span>
          </div>
          <div>
            <strong>Saved search</strong>
            <span>Your last search results stay attached to your account.</span>
          </div>
          <div>
            <strong>Queue memory</strong>
            <span>Resume where you left off without rebuilding the session.</span>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-panel-secondary">
        <div className="brand auth-brand">
          <div className="brand-mark">O</div>
          <strong>SoundSphere</strong>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Log In
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label className="auth-field">
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Enter your name"
                required
              />
            </label>
          ) : null}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="Enter your email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Enter your password"
              minLength={6}
              required
            />
          </label>

          <button type="submit" className="accent-button full auth-submit">
            {status === 'loading'
              ? 'Please wait...'
              : mode === 'signup'
                ? 'Create Account'
                : 'Log In'}
          </button>
        </form>

        {authError ? <p className="error-copy">{authError}</p> : null}
        <p className="subtle-text">
          {mode === 'signup'
            ? 'Already have an account? Switch to Log In.'
            : 'Need an account? Switch to Sign Up.'}
        </p>
      </section>
    </main>
  )
}
