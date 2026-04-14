import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Layout } from '../components/Layout'
import { supabase } from '../lib/supabase'

export function OrderSuccessPage() {
  const location = useLocation()
  const { orderId, exitToken, total } = location.state || {}
  const [order, setOrder] = useState(null)
  const [qrTs] = useState(() => Date.now())

  const qrPayload = useMemo(
    () =>
      orderId && exitToken
        ? JSON.stringify({
            type: 'scan_go_exit',
            orderId,
            token: exitToken,
            ts: qrTs,
          })
        : '',
    [orderId, exitToken, qrTs],
  )

  useEffect(() => {
    if (!orderId || !supabase) return
    let ignore = false
    ;(async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, total, receipt, created_at, order_items (qty, unit_price, line_subtotal, product_id)')
        .eq('id', orderId)
        .maybeSingle()
      if (!ignore && data) setOrder(data)
    })()
    return () => {
      ignore = true
    }
  }, [orderId])

  if (!orderId || !exitToken) {
    return <Navigate to="/scan" replace />
  }

  return (
    <Layout title="Order placed" showNav={false}>
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#3d9a1f] text-3xl text-white shadow-lg">
          ✓
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">You&apos;re all set</h1>
          <p className="mt-2 text-sm text-stone-500">
            Show this QR at the exit. Order <span className="font-mono text-xs">{orderId.slice(0, 8)}…</span>
          </p>
        </div>

        <div className="flex justify-center rounded-2xl bg-white p-6 shadow-lg ring-1 ring-stone-100">
          <QRCodeSVG value={qrPayload} size={200} level="M" includeMargin />
        </div>

        <div className="rounded-2xl bg-[#ffd209]/30 px-4 py-3 text-sm font-semibold text-stone-900">
          Paid ₹{Number(total).toFixed(2)} · GST included per receipt
        </div>

        {order?.receipt && (
          <div className="rounded-2xl border border-stone-100 bg-white p-4 text-left text-sm shadow-sm">
            <p className="font-bold text-stone-900">Receipt</p>
            <ul className="mt-2 space-y-1 text-stone-600">
              {(order.receipt.lines || []).map((line, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>
                    {line.name} × {line.qty}
                  </span>
                  <span className="font-semibold text-stone-900">
                    ₹{Number(line.line_payable).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-stone-100 pt-2 text-xs text-stone-400">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Link
            to="/scan"
            className="block w-full rounded-xl bg-[#3d9a1f] py-3.5 text-center font-bold text-white shadow-md"
          >
            Scan more items
          </Link>
          <Link to="/stores" className="text-sm font-semibold text-stone-500 hover:text-stone-800">
            Switch store
          </Link>
        </div>
      </div>
    </Layout>
  )
}
