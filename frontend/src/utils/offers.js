/** @param {{ type: string, value: number }} | null | undefined offer */
export function lineAfterOffer(unitMrp, qty, offer) {
  const base = round2(unitMrp * qty)
  if (!offer || !offer.type) return base
  const v = Number(offer.value) || 0
  switch (offer.type) {
    case 'percent':
      return round2(base * (1 - Math.min(v, 100) / 100))
    case 'flat':
      return Math.max(0, round2(base - v))
    case 'bogo': {
      const paid = Math.ceil(qty / 2)
      return round2(paid * unitMrp)
    }
    default:
      return base
  }
}

export function pickActiveOffer(offers) {
  if (!offers?.length) return null
  const now = Date.now()
  const valid = offers.filter((o) => new Date(o.valid_till).getTime() > now)
  if (!valid.length) return null
  valid.sort((a, b) => new Date(b.valid_till) - new Date(a.valid_till))
  return valid[0]
}

export function round2(n) {
  return Math.round(n * 100) / 100
}
