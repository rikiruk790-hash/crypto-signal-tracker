// =====================
// RSI CALCULATION
// =====================
export function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return null

  let gains = 0, losses = 0

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gains += diff
    else losses += Math.abs(diff)
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const gain = diff >= 0 ? diff : 0
    const loss = diff < 0 ? Math.abs(diff) : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2))
}

export function getRSIState(rsi, prevRsi) {
  let state = 'neutral'
  let momentum = rsi > prevRsi ? 'rising' : 'falling'

  if (rsi < 30) state = 'oversold'
  else if (rsi > 70) state = 'overbought'

  const oversoldRecovery = prevRsi < 30 && rsi > prevRsi
  const overboughtRejection = prevRsi > 70 && rsi < prevRsi

  return { state, momentum, oversoldRecovery, overboughtRejection }
}

// =====================
// EMA CALCULATION
// =====================
function calculateEMAArray(values, period) {
  const k = 2 / (period + 1)
  const emas = [values[0]]
  for (let i = 1; i < values.length; i++) {
    emas.push(values[i] * k + emas[i - 1] * (1 - k))
  }
  return emas
}

// =====================
// MACD CALCULATION
// =====================
export function calculateMACD(closes) {
  if (closes.length < 35) return null

  const ema12Array = calculateEMAArray(closes, 12)
  const ema26Array = calculateEMAArray(closes, 26)

  const macdLine = ema12Array.map((v, i) => v - ema26Array[i])
  const signalLine = calculateEMAArray(macdLine.slice(26), 9)

  const lastMACD = macdLine[macdLine.length - 1]
  const prevMACD = macdLine[macdLine.length - 2]
  const lastSignal = signalLine[signalLine.length - 1]
  const prevSignal = signalLine[signalLine.length - 2]

  const lastHist = lastMACD - lastSignal
  const prevHist = prevMACD - prevSignal

  let crossover = 'none'
  if (prevMACD <= prevSignal && lastMACD > lastSignal) crossover = 'bullish'
  else if (prevMACD >= prevSignal && lastMACD < lastSignal) crossover = 'bearish'

  const histBullish = lastHist > prevHist || lastHist > 0
  const histBearish = lastHist < prevHist || lastHist < 0

  return { crossover, histogram: lastHist, histBullish, histBearish, macdAboveSignal: lastMACD > lastSignal }
}

// =====================
// SUPPORT & RESISTANCE
// =====================
export function findSupportResistance(highs, lows, closes, threshold = 0.025) {
  const currentPrice = closes[closes.length - 1]

  const swingLows = []
  for (let i = 2; i < lows.length - 2; i++) {
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] &&
        lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
      swingLows.push(lows[i])
    }
  }

  const swingHighs = []
  for (let i = 2; i < highs.length - 2; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] &&
        highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
      swingHighs.push(highs[i])
    }
  }

  const supportLevels = swingLows.filter(l => l < currentPrice)
  const resistanceLevels = swingHighs.filter(h => h > currentPrice)

  const supportPrice = supportLevels.length > 0 ? Math.max(...supportLevels) : null
  const resistancePrice = resistanceLevels.length > 0 ? Math.min(...resistanceLevels) : null

  const nearSupport = supportPrice &&
    Math.abs(currentPrice - supportPrice) / supportPrice <= threshold
  const nearResistance = resistancePrice &&
    Math.abs(resistancePrice - currentPrice) / resistancePrice <= threshold

  return {
    supportPrice,
    resistancePrice,
    nearSupport,
    nearResistance,
    supportZone: supportLevels.length >= 1,
    resistanceZone: resistanceLevels.length >= 1,
  }
}

// =====================
// SIGNAL SCORING
// =====================
export function calculateScore({ srAlignment, rsiConfirm, macdConfirm, breakoutRetest }) {
  let score = 0
  if (srAlignment) score += 35
  if (rsiConfirm) score += 25
  if (macdConfirm) score += 25
  if (breakoutRetest) score += 15
  return score
}

export function getGrade(score) {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  return 'IGNORE'
}

// =====================
// SIGNAL GENERATOR
// =====================
export function generateSignal({ sr, rsi, rsiState, macd, currentPrice }) {

  // RSI relax — oversold বা rising momentum
  const rsiBuyOk = rsi < 45 && rsiState.momentum === 'rising'
  const rsiSellOk = rsi > 55 && rsiState.momentum === 'falling'

  // MACD relax — crossover অথবা macd above signal
  const macdBuyOk = macd.crossover === 'bullish' || (macd.macdAboveSignal && macd.histBullish)
  const macdSellOk = macd.crossover === 'bearish' || (!macd.macdAboveSignal && macd.histBearish)

  // BUY সিগন্যাল
  if (sr.nearSupport && rsiBuyOk && macdBuyOk) {
    const score = calculateScore({
      srAlignment: true,
      rsiConfirm: true,
      macdConfirm: true,
      breakoutRetest: false
    })
    if (score >= 70) {
      return {
        signal: 'BUY',
        score,
        grade: getGrade(score),
        tp: parseFloat((currentPrice * 1.015).toFixed(8)),
        sl: parseFloat((currentPrice * 0.99).toFixed(8)),
      }
    }
  }

  // SELL সিগন্যাল
  if (sr.nearResistance && rsiSellOk && macdSellOk) {
    const score = calculateScore({
      srAlignment: true,
      rsiConfirm: true,
      macdConfirm: true,
      breakoutRetest: false
    })
    if (score >= 70) {
      return {
        signal: 'SELL',
        score,
        grade: getGrade(score),
        tp: parseFloat((currentPrice * 0.985).toFixed(8)),
        sl: parseFloat((currentPrice * 1.01).toFixed(8)),
      }
    }
  }

  return null
}
