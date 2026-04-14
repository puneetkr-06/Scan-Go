/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import { pickActiveOffer } from '../utils/offers'
import { useStore } from './StoreContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { selectedStore } = useStore()
  const [lines, setLines] = useState([])
  const [priceAlerts, setPriceAlerts] = useState([])

  const clearCart = useCallback(() => {
    setLines([])
    setPriceAlerts([])
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset cart when store changes
    clearCart()
  }, [selectedStore?.id, clearCart])

  const dismissAlert = useCallback((productId) => {
    setPriceAlerts((a) => a.filter((id) => id !== productId))
  }, [])

  const applyProductRemoteUpdate = useCallback((row) => {
    if (!row?.id) return
    setLines((prev) => {
      let changed = false
      const next = prev.map((line) => {
        if (line.product.id !== row.id) return line
        changed = true
        const oldPrice = Number(line.priceAtScan)
        const newPrice = Number(row.price)
        if (oldPrice !== newPrice) {
          setPriceAlerts((a) => (a.includes(row.id) ? a : [...a, row.id]))
        }
        return {
          ...line,
          product: {
            ...line.product,
            price: row.price,
            stock: row.stock,
          },
        }
      })
      return changed ? next : prev
    })
  }, [])

  useEffect(() => {
    if (!supabase || !selectedStore?.id) return

    const channel = supabase
      .channel(`products:${selectedStore.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${selectedStore.id}`,
        },
        (payload) => applyProductRemoteUpdate(payload.new),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedStore?.id, applyProductRemoteUpdate])

  const addProduct = useCallback((product) => {
    const stock = Number(product.stock) || 0
    const price = Number(product.price) || 0
    if (stock < 1) return { ok: false, reason: 'out_of_stock' }

    setLines((prev) => {
      const idx = prev.findIndex((l) => l.product.id === product.id)
      if (idx >= 0) {
        const nextQty = prev[idx].qty + 1
        if (nextQty > stock) return prev
        const copy = [...prev]
        copy[idx] = {
          ...copy[idx],
          qty: nextQty,
          product: { ...copy[idx].product, stock, price },
        }
        return copy
      }
      return [
        ...prev,
        {
          product: { ...product, price, stock },
          qty: 1,
          priceAtScan: price,
        },
      ]
    })
    return { ok: true }
  }, [])

  const setQty = useCallback((productId, qty) => {
    const q = Math.max(0, Math.floor(Number(qty) || 0))
    setLines((prev) => {
      const line = prev.find((l) => l.product.id === productId)
      if (!line) return prev
      if (q === 0) return prev.filter((l) => l.product.id !== productId)
      if (q > line.product.stock) return prev
      return prev.map((l) =>
        l.product.id === productId ? { ...l, qty: q } : l,
      )
    })
  }, [])

  const removeLine = useCallback((productId) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId))
    dismissAlert(productId)
  }, [dismissAlert])

  const value = useMemo(
    () => ({
      lines,
      priceAlertIds: priceAlerts,
      dismissPriceAlert: dismissAlert,
      addProduct,
      setQty,
      removeLine,
      clearCart,
    }),
    [lines, priceAlerts, dismissAlert, addProduct, setQty, removeLine, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function useCartLineOffer(line) {
  return pickActiveOffer(line.product.offers)
}
