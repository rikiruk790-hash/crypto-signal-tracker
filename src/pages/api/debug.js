import { fetchKlines, fetchPrice } from '../../lib/binance'
import {
  calculateRSI, getRSIState,
  calculateMACD,
  findSupportResistance,
  generateSignal
} from '../../lib/indicators'

export default async function handler(req, res) {
  const symbol = req.query.symbol || 'BTCUSDT'
  try {
    const { highs, lows, closes } = await fetchKlines(symbol)
    const currentPrice = closes[closes.length - 1]
    const rsi = calculateRSI(closes)
    const prevRsi = calculateRSI(closes.slice(0, -1))
    const rsiState = getRSIState(rsi, prevRsi)
    const macd = calculateMACD(closes)
    const sr = findSupportResistance(highs, lows, closes)
    const signal = generateSignal({ sr, rsi, rsiState, macd, currentPrice })

    return res.status(200).json({
      symbol, currentPrice, rsi, rsiState, macd, sr, signal,
      conditions: {
        nearSupport: sr.nearSupport,
        nearResistance: sr.nearResistance,
        rsiBuyOk: rsi < 55,
        rsiSellOk: rsi > 45,
        macdBuyOk: macd.crossover === 'bullish' || macd.histBullish,
        macdSellOk: macd.crossover === 'bearish' || macd.histBearish,
      }
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
