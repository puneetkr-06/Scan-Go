import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { EnvConfigWarning } from '../components/EnvConfigWarning'
import { GoogleBrandIcon } from '../components/GoogleBrandIcon'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { session, loading, isConfigured, signInWithPassword, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [pending, setPending] = useState(false)

  if (!loading && session) {
    return <Navigate to="/stores" replace />
  }

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    if (!email.trim() || !password) {
      setErr('Enter your email and password')
      return
    }
    setPending(true)
    try {
      await signInWithPassword(email, password)
    } catch (e) {
      setErr(e.message || 'Invalid email or password')
    } finally {
      setPending(false)
    }
  }

  async function onGoogle() {
    setErr('')
    setPending(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      setErr(e.message || 'Google sign-in failed')
      setPending(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#1a1a1a] px-4 py-10 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-[#7ed321]">Scan</span>&amp;Go
          </h1>
          <p className="mt-2 text-sm text-stone-400">Skip the queue — scan, pay, leave.</p>
        </div>

        <EnvConfigWarning />

        <div className="rounded-3xl bg-white p-6 text-stone-900 shadow-xl">
          <h2 className="mb-4 text-lg font-extrabold text-stone-900">Log in</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-stone-600">Email (login ID)</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-stone-200 px-4 py-3 text-stone-900 outline-none focus:border-[#3d9a1f]"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-stone-600">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-stone-200 px-4 py-3 text-stone-900 outline-none focus:border-[#3d9a1f]"
                placeholder="••••••••"
              />
            </label>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button
              type="submit"
              disabled={pending || !isConfigured}
              className="w-full rounded-xl bg-[#3d9a1f] py-3.5 font-bold text-white shadow-md transition hover:bg-[#35891b] disabled:opacity-50"
            >
              {pending ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 font-medium text-stone-400">or</span>
            </div>
          </div>

          <button
            type="button"
            disabled={pending || !isConfigured}
            onClick={onGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-stone-200 bg-white py-3.5 font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:opacity-50"
          >
            <GoogleBrandIcon />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-stone-600">
            No account?{' '}
            <Link to="/signup" className="font-bold text-[#3d9a1f] hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-stone-500">
          By continuing you agree to in-store Scan &amp; Go terms.
        </p>
      </div>
    </div>
  )
}
