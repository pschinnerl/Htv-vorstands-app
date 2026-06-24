import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('E-Mail oder Passwort falsch. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch {
      setError('Fehler beim Senden der Reset-E-Mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-white font-bold text-2xl"
            style={{ backgroundColor: 'var(--htv-blue)' }}
          >
            HTV
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">Vorstands-App</h1>
          <p className="text-slate-500 text-sm mt-1">Helmstedter Tennis-Verein e.V.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {!showReset ? (
            <>
              <h2 className="text-lg font-medium text-slate-800 mb-6">Anmelden</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': 'var(--htv-blue)' } as React.CSSProperties}
                    placeholder="vorstand@htv.de"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: 'var(--htv-blue)' }}
                >
                  {loading ? 'Anmelden…' : 'Anmelden'}
                </button>
              </form>

              <button
                onClick={() => { setShowReset(true); setError('') }}
                className="mt-4 text-sm w-full text-center"
                style={{ color: 'var(--htv-blue-light)' }}
              >
                Passwort vergessen?
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium text-slate-800 mb-2">Passwort zurücksetzen</h2>
              <p className="text-slate-500 text-sm mb-6">
                Gib deine E-Mail-Adresse ein – wir senden dir einen Reset-Link.
              </p>
              {resetSent ? (
                <div className="text-green-700 bg-green-50 rounded-lg px-4 py-3 text-sm">
                  ✓ Reset-E-Mail wurde gesendet. Bitte prüfe dein Postfach.
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                      placeholder="vorstand@htv.de"
                    />
                  </div>
                  {error && (
                    <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: 'var(--htv-blue)' }}
                  >
                    {loading ? 'Senden…' : 'Reset-Link senden'}
                  </button>
                </form>
              )}
              <button
                onClick={() => { setShowReset(false); setResetSent(false); setError('') }}
                className="mt-4 text-sm w-full text-center text-slate-500 hover:text-slate-700"
              >
                ← Zurück zum Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
