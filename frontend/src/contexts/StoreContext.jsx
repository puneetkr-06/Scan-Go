/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'scan-go-store-id'

function readStoredStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [selectedStore, setSelectedStoreState] = useState(readStoredStore)

  const setSelectedStore = (store) => {
    setSelectedStoreState(store)
    if (store) localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    else localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo(
    () => ({ selectedStore, setSelectedStore }),
    [selectedStore],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
