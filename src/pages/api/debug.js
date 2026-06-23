import { fetchKlines } from '../../lib/binance'
import {
  calculateRSI, getRSIState,
  calculateMACD,
  findSupportResistance,
} from '../../lib/indicators'

export default async function handler(req, res) {
  const symbol = req.query.symbol || 'BTCUSDT'

  try {
    const { highs, lows, closes } = await fetchKlines(symbol, '15m', 100)
    const currentPrice = closes[closes.length - 1]

    const rsi = calculateRSI(closes)
    const prevRsi = calculateRSI(closes.slice(0, -1))
    const rsiState = getRSIState(rsi, prevRsi)
    const macd = calculateMACD(closes)
    const sr = findSupportResistance(highs, lows, closes)

    const rsiBuyOk = rsi < 45 && rsiState.momentum === 'rising'
    const rsiSellOk = rsi > 55 && rsiState.momentum === 'falling'
    const macdBuyOk = macd.crossover === 'bullish' || (macd.macdAboveSignal && macd.histBullish)
    const macdSellOk = macd.crossover === 'bearish' || (!macd.macdAboveSignal && macd.histBearish)

    return res.status(200).json({
      symbol,
      currentPrice,
      rsi,
      rsiState,
      rsiBuyOk,
      rsiSellOk,
      macd,
      macdBuyOk,
      macdSellOk,
      sr,
      buySignalPossible: sr.nearSupport && rsiBuyOk && macdBuyOk,
      sellSignalPossible: sr.nearResistance && rsiSellOk && macdSellOk,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
