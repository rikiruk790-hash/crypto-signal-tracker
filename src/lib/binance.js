const BINANCE_BASE = 'https://api.binance.com'

// Top 50 USDT পেয়ার
export const TOP_PAIRS = [
  'BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT',
  'ADAUSDT','DOGEUSDT','AVAXUSDT','DOTUSDT','MATICUSDT',
  'LINKUSDT','LTCUSDT','UNIUSDT','ATOMUSDT','ETCUSDT',
  'XLMUSDT','NEARUSDT','ALGOUSDT','APTUSDT','FILUSDT',
  'ARBUSDT','OPUSDT','INJUSDT','SUIUSDT','SEIUSDT',
  'TIAUSDT','PYTHUSDT','WLDUSDT','FETUSDT','GRTUSDT',
  'SANDUSDT','MANAUSDT','APEUSDT','AAVEUSDT','MKRUSDT',
  'SNXUSDT','COMPUSDT','CRVUSDT','1INCHUSDT','RUNEUSDT',
  'FTMUSDT','HBARUSDT','EGLDUSDT','FLOWUSDT','ICPUSDT',
  'VETUSDT','THETAUSDT','QNTUSDT','KSMUSDT','ZECUSDT'
]

// Binance থেকে কান্ডেল ডেটা আনা
export async function fetchKlines(symbol, interval = '15m', limit = 100) {
  const url = `${BINANCE_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Binance error: ${res.status}`)
  const data = await res.json()
  
  return {
    opens:  data.map(k => parseFloat(k[1])),
    highs:  data.map(k => parseFloat(k[2])),
    lows:   data.map(k => parseFloat(k[3])),
    closes: data.map(k => parseFloat(k[4])),
  }
}

// লাইভ প্রাইস আনা
export async function fetchPrice(symbol) {
  const url = `${BINANCE_BASE}/api/v3/ticker/price?symbol=${symbol}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Price fetch error`)
  const data = await res.json()
  return parseFloat(data.price)
}
