import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { EnvConfigWarning } from '../components/EnvConfigWarning'
import { GoogleBrandIcon } from '../components/GoogleBrandIcon'
import { useAuth } from '../contexts/AuthContext'

export function SignupPage() {
  const { session, loading, isConfigured, signUp, signInWithGoogle } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [pending, setPending] = useState(false)

  if (!loading && session) {
    return <Navigate to="/stores" replace />
  }

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    if (!name.trim()) {
      setErr('Enter your name')
      return
    }
    if (!email.trim()) {
      setErr('Enter your email (login ID)')
      return
    }
    if (password.length < 6) {
      setErr('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setErr('Passwords do not match')
      return
    }
    setPending(true)
    try {
      const data = await signUp(email, password, name)
      if (data?.session) {
        setMsg('Account created. Redirecting…')
      } else {
        setMsg('confirm_email')
      }
    } catch (e) {
      setErr(e.message || 'Could not create account')
    } finally {
      setPending(false)
    }
  }

  async function onGoogle() {
    setErr('')
    setMsg('')
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
          <p className="mt-2 text-sm text-stone-400">Create your account</p>
        </div>

        <EnvConfigWarning />

        <div className="rounded-3xl bg-white p-6 text-stone-900 shadow-xl">
          <h2 className="mb-4 text-lg font-extrabold text-stone-900">Sign up</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-stone-600">Full name</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-stone-200 px-4 py-3 text-stone-900 outline-none focus:border-[#3d9a1f]"
                placeholder="Your name"
              />
            </label>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-stone-200 px-4 py-3 text-stone-900 outline-none focus:border-[#3d9a1f]"
                placeholder="At least 6 characters"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-stone-600">Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-stone-200 px-4 py-3 text-stone-900 outline-none focus:border-[#3d9a1f]"
                placeholder="Repeat password"
              />
            </label>
            {err && <p className="text-sm text-red-600">{err}</p>}
            {msg === 'confirm_email' && (
              <p className="text-sm text-[#3d9a1f]">
                Check your email to confirm your account (if confirmation is enabled in Supabase), then{' '}
                <Link to="/login" className="font-bold underline">
                  log in
                </Link>
                .
              </p>
            )}
            {msg && msg !== 'confirm_email' && <p className="text-sm text-[#3d9a1f]">{msg}</p>}
            <button
              type="submit"
              disabled={pending || !isConfigured}
              className="w-full rounded-xl bg-[#3d9a1f] py-3.5 font-bold text-white shadow-md transition hover:bg-[#35891b] disabled:opacity-50"
            >
              {pending ? 'Creating account…' : 'Create account'}
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
            Sign up with Google
          </button>

          <p className="mt-6 text-center text-sm text-stone-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#3d9a1f] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
