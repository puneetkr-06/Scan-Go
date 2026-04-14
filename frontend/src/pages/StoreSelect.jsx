import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchStores } from '../api/products'
import { Layout } from '../components/Layout'
import { useStore } from '../contexts/StoreContext'

export function StoreSelectPage() {
  const { selectedStore, setSelectedStore } = useStore()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data, error } = await fetchStores()
      if (!alive) return
      if (error) setErr(error.message)
      else setStores(data || [])
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [])

  function choose(store) {
    setSelectedStore(store)
    navigate('/scan', { replace: true })
  }

  return (
    <Layout title="Choose store">
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#3d9a1f] to-[#2d7a15] p-5 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">Shopping at</p>
          <h2 className="mt-1 text-xl font-extrabold">
            {selectedStore?.name || 'Pick a store to start'}
          </h2>
          {selectedStore?.location && (
            <p className="mt-1 text-sm text-white/90">{selectedStore.location}</p>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#3d9a1f] border-t-transparent" />
          </div>
        )}

        {err && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>
        )}

        <ul className="space-y-3">
          {stores.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => choose(s)}
                className="flex w-full items-start gap-4 rounded-2xl border-2 border-stone-100 bg-white p-4 text-left shadow-sm transition hover:border-[#3d9a1f]/50 hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffd209]/90 text-lg font-black text-stone-900">
                  {s.name?.[0] ?? '?'}
                </span>
                <div>
                  <p className="font-bold text-stone-900">{s.name}</p>
                  <p className="text-sm text-stone-500">{s.location}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>

        {!loading && stores.length === 0 && !err && (
          <p className="text-center text-sm text-stone-500">
            No stores yet. Run <code className="rounded bg-stone-100 px-1">seed.sql</code> in Supabase.
          </p>
        )}
      </div>
    </Layout>
  )
}
