import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function ProfilePage() {
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [orderStats, setOrderStats] = useState({ count: 0, total: 0, saved: 0 })
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  const user = session?.user

  useEffect(() => {
    if (!supabase || !user) { setLoadingProfile(false); return }
    let ignore = false
    ;(async () => {
      // Fetch profile name
      const { data: prof } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      // Fetch order stats
      const { data: orders } = await supabase
        .from('orders')
        .select('total, receipt')
        .order('created_at', { ascending: false })

      if (ignore) return

      setProfile(prof)
      if (orders) {
        const count = orders.length
        const total = orders.reduce((s, o) => s + Number(o.total), 0)
        const saved = orders.reduce((s, o) => s + Number(o.receipt?.discount_total || 0), 0)
        setOrderStats({ count, total, saved })
      }
      setLoadingProfile(false)
    })()
    return () => { ignore = true }
  }, [user])

  async function signOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const displayName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'
  const email = user?.email || ''
  const initials = displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const provider = user?.app_metadata?.provider || 'email'
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : ''

  if (authLoading || loadingProfile) {
    return (
      <Layout title="Profile">
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#3d9a1f] border-t-transparent"/>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Profile">
      <div className="space-y-4">
        {/* Avatar + name card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-5 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7ed321] text-xl font-black text-[#1a1a1a] shadow-inner">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-tight truncate">{displayName}</p>
              <p className="mt-0.5 text-sm text-stone-400 truncate">{email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-300">
                  {provider === 'google' ? 'Google' : 'Email'} account
                </span>
                {memberSince && (
                  <span className="text-[10px] text-stone-500">Since {memberSince}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Orders', value: orderStats.count },
            { label: 'Total spent', value: `₹${orderStats.total.toFixed(0)}` },
            { label: 'Total saved', value: `₹${orderStats.saved.toFixed(0)}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-white border border-stone-100 px-3 py-3 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
              <p className="mt-1 text-base font-extrabold text-stone-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Account details */}
        <div className="rounded-2xl bg-white border border-stone-100 shadow-sm overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">Account</p>
          {[
            { label: 'Name', value: displayName },
            { label: 'Email', value: email },
            { label: 'Sign-in method', value: provider === 'google' ? 'Google OAuth' : 'Email & Password' },
            { label: 'User ID', value: user?.id?.slice(0, 16) + '…' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3 border-t border-stone-100 first:border-t-0">
              <span className="text-sm text-stone-500">{label}</span>
              <span className="text-sm font-semibold text-stone-900 text-right max-w-[55%] truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <button
          type="button"
          disabled={signingOut}
          onClick={signOut}
          className="w-full rounded-xl border-2 border-red-100 bg-red-50 py-3.5 font-bold text-red-600 hover:bg-red-100 transition disabled:opacity-50"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>

        <p className="text-center text-xs text-stone-400 pb-2">Scan &amp; Go · Grocery</p>
      </div>
    </Layout>
  )
}
