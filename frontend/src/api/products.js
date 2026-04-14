import { supabase } from '../lib/supabase'

const productSelect = `
  id,
  store_id,
  barcode,
  name,
  price,
  stock,
  offers ( id, type, value, valid_till )
`

export async function fetchProductByBarcode(storeId, barcode) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') }

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('store_id', storeId)
    .eq('barcode', barcode)
    .maybeSingle()

  return { data, error }
}

export async function fetchStores() {
  if (!supabase) return { data: [], error: new Error('Supabase not configured') }
  return supabase.from('stores').select('id, name, location').order('name')
}
