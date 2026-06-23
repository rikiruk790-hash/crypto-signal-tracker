// KuCoin API — Binance-এর বিকল্প, কোনো geo-restriction নেই
const KUCOIN_BASE = 'https://api.kucoin.com'

// Top 50 পেয়ার — KuCoin format (USDT)
export const TOP_PAIRS = [
  'BTC-USDT','ETH-USDT','BNB-USDT','SOL-USDT','XRP-USDT',
  'ADA-USDT','DOGE-USDT','AVAX-USDT','DOT-USDT','MATIC-USDT',
  'LINK-USDT','LTC-USDT','UNI-USDT','ATOM-USDT','ETC-USDT',
  'XLM-USDT','NEAR-USDT','ALGO-USDT','APT-USDT','FIL-USDT',
  'ARB-USDT','OP-USDT','INJ-USDT','SUI-USDT','SEI-USDT',
  'TIA-USDT','WLD-USDT','FET-USDT','GRT-USDT','SAND-USDT',
  'MANA-USDT','APE-USDT','AAVE-USDT','MKR-USDT','SNX-USDT',
  'COMP-USDT','CRV-USDT','RUNE-USDT','FTM-USDT','HBAR-USDT',
  'EGLD-USDT','FLOW-USDT','ICP-USDT','VET-USDT','THETA-USDT',
  'QNT-USDT','KSM-USDT','ZEC-USDT','ONE-USDT','ROSE-USDT'
]

// KuCoin থেকে কান্ডেল ডেটা আনা
export async function fetchKlines(symbol, interval = '15min', limit = 100) {
  // KuCoin interval format: 1min, 5min, 15min, 1hour, 4hour
  const endTime = Math.floor(Date.now() / 1000)
  const startTime = endTime - (limit * 15 * 60) // 15 min candles

  const url = `${KUCOIN_BASE}/api/v1/market/candles?type=${interval}&symbol=${symbol}&startAt=${startTime}&endAt=${endTime}`
  
  const res = await fetch(url)
  if (!res.ok) throw new Error(`KuCoin error: ${res.status}`)
  const json = await res.json()
  
  if (json.code !== '200000') throw new Error(`KuCoin: ${json.msg}`)
  
  // KuCoin returns newest first, so reverse
  const data = json.data.reverse()
  
  if (data.length < 40) throw new Error(`Not enough candles: ${data.length}`)

  return {
    opens:  data.map(k => parseFloat(k[1])),
    closes: data.map(k => parseFloat(k[2])),
    highs:  data.map(k => parseFloat(k[3])),
    lows:   data.map(k => parseFloat(k[4])),
  }
}

// লাইভ প্রাইস আনা
export async function fetchPrice(symbol) {
  const url = `${KUCOIN_BASE}/api/v1/market/orderbook/level1?symbol=${symbol}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Price fetch error`)
  const json = await res.json()
  if (json.code !== '200000') throw new Error(`KuCoin price error`)
  return parseFloat(json.data.price)
}
