import { Link, Navigate, useLocation } from 'react-router-dom'
import { useStore } from '../contexts/StoreContext'

export function StoreGate({ children }) {
  const { selectedStore } = useStore()
  const location = useLocation()

  if (!selectedStore?.id) {
    if (location.pathname === '/scan') {
      return (
        <div className="min-h-dvh bg-[#f6f7f5] px-4 py-10 text-stone-900">
          <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-md flex-col items-center justify-center">
            <div className="w-full rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
                ⚠
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-amber-600">
                Store required
              </p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">
                Please select a store first
              </h1>
              <p className="mt-3 text-sm leading-6 text-stone-500">
                You need to choose the store you are shopping at before scanning products.
              </p>
              <Link
                to="/stores"
                replace
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#3d9a1f] px-4 py-3.5 font-bold text-white shadow-md transition hover:bg-[#35891b]"
              >
                Choose a store
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return <Navigate to="/stores" state={{ from: location }} replace />
  }

  return children
}
