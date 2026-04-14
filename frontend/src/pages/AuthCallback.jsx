import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

/**
 * OAuth redirect target (Google). PKCE / hash tokens are handled by the Supabase client.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      navigate('/login', { replace: true })
      return
    }

    let cancelled = false

    async function finish() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      if (session) {
        navigate('/stores', { replace: true })
        return
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, sess) => {
        if (sess) {
          navigate('/stores', { replace: true })
        }
      })

      await new Promise((r) => setTimeout(r, 800))
      if (cancelled) {
        subscription.unsubscribe()
        return
      }

      const {
        data: { session: s2 },
      } = await supabase.auth.getSession()
      subscription.unsubscribe()
      if (!cancelled) {
        navigate(s2 ? '/stores' : '/login', { replace: true })
      }
    }

    finish()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#1a1a1a] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#7ed321] border-t-transparent" />
      <p className="text-sm text-stone-400">Completing sign-in…</p>
    </div>
  )
}
