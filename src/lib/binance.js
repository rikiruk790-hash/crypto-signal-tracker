// Bybit API — সব জায়গা থেকে কাজ করে, 15m candle আছে
const BYBIT_BASE = 'https://api.bybit.com'

export const TOP_PAIRS = [
  'BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT',
  'ADAUSDT','DOGEUSDT','AVAXUSDT','DOTUSDT','MATICUSDT',
  'LINKUSDT','LTCUSDT','UNIUSDT','ATOMUSDT','ETCUSDT',
  'XLMUSDT','NEARUSDT','ALGOUSDT','APTUSDT','FILUSDT',
  'ARBUSDT','OPUSDT','INJUSDT','SUIUSDT','SEIUSDT',
  'TIAUSDT','WLDUSDT','FETUSDT','GRTUSDT','SANDUSDT',
  'MANAUSDT','APEUSDT','AAVEUSDT','MKRUSDT','SNXUSDT',
  'COMPUSDT','CRVUSDT','RUNEUSDT','FTMUSDT','HBARUSDT',
  'EGLDUSDT','FLOWUSDT','ICPUSDT','VETUSDT','THETAUSDT',
  'QNTUSDT','KSMUSDT','ZECUSDT','ONEUSDT','ROSEUSDT'
]

// Bybit থেকে 15m candle আনা
export async function fetchKlines(symbol, interval = '30', limit = 100) {
  const url = `${BYBIT_BASE}/v5/market/kline?category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`
  
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Bybit error: ${res.status}`)
  const json = await res.json()
  
  if (json.retCode !== 0) throw new Error(`Bybit: ${json.retMsg}`)
  
  // Bybit returns newest first, so reverse
  const data = json.result.list.reverse()
  
  if (data.length < 40) throw new Error(`Not enough candles: ${data.length}`)

  return {
    opens:  data.map(k => parseFloat(k[1])),
    highs:  data.map(k => parseFloat(k[2])),
    lows:   data.map(k => parseFloat(k[3])),
    closes: data.map(k => parseFloat(k[4])),
  }
}

// লাইভ প্রাইস
export async function fetchPrice(symbol) {
  const url = `${BYBIT_BASE}/v5/market/tickers?category=spot&symbol=${symbol}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Price fetch error`)
  const json = await res.json()
  if (json.retCode !== 0) throw new Error(`Bybit price error`)
  return parseFloat(json.result.list[0].lastPrice)
}
