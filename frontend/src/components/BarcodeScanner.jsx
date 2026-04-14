import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser'
import { DecodeHintType } from '@zxing/library'
import { useCallback, useEffect, useRef, useState } from 'react'

export function BarcodeScanner({ onScan, paused }) {
  const [videoEl, setVideoEl] = useState(null)
  const lastRef = useRef({ code: '', t: 0 })
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(true)

  const handleDecode = useCallback(
    (text) => {
      if (!text || paused) return
      const now = Date.now()
      if (text === lastRef.current.code && now - lastRef.current.t < 1800) return
      lastRef.current = { code: text, t: now }
      onScan(text.trim())
    },
    [onScan, paused],
  )

  useEffect(() => {
    if (!videoEl) return

    let cancelled = false

    // 🔥 IMPORTANT: Restrict formats
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
    ])

    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 200,
    })

    let controls

    const startScanner = async () => {
      try {
        // ✅ Force back camera
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const backCamera =
          devices.find((d) => d.label.toLowerCase().includes('back')) || devices[0]

        controls = await reader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoEl,
          (result, err) => {
            if (cancelled) return

            if (result) {
              setStarting(false)
              setError(null)

              const text = result.getText()
              console.log("SCANNED:", text)

              handleDecode(text)
            }

            if (err && err.name !== 'NotFoundException') {
              setStarting(false)
            }
          },
        )

        if (!cancelled) setStarting(false)
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Camera unavailable')
          setStarting(false)
        }
      }
    }

    startScanner()

    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [videoEl, handleDecode])

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black shadow-lg ring-2 ring-[#3d9a1f]/30">
      <video
        ref={setVideoEl}
        className="aspect-[4/3] w-full object-cover"
        muted
        playsInline
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-32 w-[72%] rounded-lg border-2 border-[#7ed321]/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
      </div>

      {starting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white">
          Starting camera…
        </div>
      )}

      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-600/95 px-3 py-2 text-center text-xs text-white">
          {error}
        </div>
      )}
    </div>
  )
}