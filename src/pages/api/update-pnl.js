import { supabase } from '../../lib/supabase'
import { fetchPrice } from '../../lib/binance'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // সব ACTIVE সিগন্যাল আনো
  const { data: activeSignals, error } = await supabase
    .from('signals')
    .select('*')
    .eq('status', 'ACTIVE')

  if (error) return res.status(500).json({ error: error.message })
  if (!activeSignals || activeSignals.length === 0) {
    return res.status(200).json({ updated: 0 })
  }

  let updated = 0

  for (const signal of activeSignals) {
    try {
      const currentPrice = await fetchPrice(signal.symbol)

      // P&L ক্যালকুলেশন
      let pnl = 0
      if (signal.signal_type === 'BUY') {
        pnl = ((currentPrice - signal.price_at_signal) / signal.price_at_signal) * 100
      } else {
        pnl = ((signal.price_at_signal - currentPrice) / signal.price_at_signal) * 100
      }

      // TP / SL চেক
      let newStatus = 'ACTIVE'
      if (signal.signal_type === 'BUY') {
        if (currentPrice >= signal.tp_price) newStatus = 'TP_HIT'
        else if (currentPrice <= signal.sl_price) newStatus = 'SL_HIT'
      } else {
        if (currentPrice <= signal.tp_price) newStatus = 'TP_HIT'
        else if (currentPrice >= signal.sl_price) newStatus = 'SL_HIT'
      }

      // আপডেট করো
      await supabase.from('signals').update({
        current_price: currentPrice,
        pnl_percent: parseFloat(pnl.toFixed(4)),
        status: newStatus,
        closed_at: newStatus !== 'ACTIVE' ? new Date().toISOString() : null,
      }).eq('id', signal.id)

      updated++
      await new Promise(r => setTimeout(r, 50))

    } catch (err) {
      console.error(`Error updating ${signal.symbol}:`, err.message)
    }
  }

  return res.status(200).json({ updated })
}
