import { supabase } from '../../lib/supabase'
import { fetchKlines } from '../../lib/binance'
import { TOP_PAIRS } from '../../lib/binance'
import {
  calculateRSI, getRSIState,
  calculateMACD,
  findSupportResistance,
  generateSignal
} from '../../lib/indicators'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const results = []
  const errors = []

  for (const symbol of TOP_PAIRS) {
    try {
      const { highs, lows, closes } = await fetchKlines(symbol, '15m', 100)
      const currentPrice = closes[closes.length - 1]

      // ইন্ডিকেটর ক্যালকুলেশন
      const rsi = calculateRSI(closes)
      const prevRsi = calculateRSI(closes.slice(0, -1))
      const rsiState = getRSIState(rsi, prevRsi)
      const macd = calculateMACD(closes)
      const sr = findSupportResistance(highs, lows, closes)

      if (!rsi || !macd) continue

      // সিগন্যাল চেক
      const signalResult = generateSignal({ sr, rsi, rsiState, macd, currentPrice })

      if (signalResult) {
        // ডুপ্লিকেট চেক — শেষ ১ ঘন্টায় একই সিগন্যাল নেই তো?
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const { data: existing } = await supabase
          .from('signals')
          .select('id')
          .eq('symbol', symbol)
          .eq('signal_type', signalResult.signal)
          .gte('created_at', oneHourAgo)
          .limit(1)

        if (existing && existing.length > 0) continue

        // সিগন্যাল সেভ করো
        const { data, error } = await supabase.from('signals').insert({
          symbol,
          timeframe: '15m',
          signal_type: signalResult.signal,
          price_at_signal: currentPrice,
          support_price: sr.supportPrice,
          resistance_price: sr.resistancePrice,
          rsi_value: rsi,
          macd_signal: macd.crossover,
          score: signalResult.score,
          grade: signalResult.grade,
          tp_price: signalResult.tp,
          sl_price: signalResult.sl,
          status: 'ACTIVE',
          current_price: currentPrice,
          pnl_percent: 0,
        }).select().single()

        if (!error && data) results.push(data)
      }

      // Rate limit এড়াতে ছোট বিরতি
      await new Promise(r => setTimeout(r, 100))

    } catch (err) {
      errors.push({ symbol, error: err.message })
    }
  }

  return res.status(200).json({
    scanned: TOP_PAIRS.length,
    newSignals: results.length,
    signals: results,
    errors: errors.length,
  })
}
