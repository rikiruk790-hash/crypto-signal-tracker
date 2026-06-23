// CoinGecko API — কোনো restriction নেই, সম্পূর্ণ ফ্রি
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

// CoinGecko coin ID map
const SYMBOL_TO_ID = {
  'BTCUSDT': 'bitcoin', 'ETHUSDT': 'ethereum', 'BNBUSDT': 'binancecoin',
  'SOLUSDT': 'solana', 'XRPUSDT': 'ripple', 'ADAUSDT': 'cardano',
  'DOGEUSDT': 'dogecoin', 'AVAXUSDT': 'avalanche-2', 'DOTUSDT': 'polkadot',
  'MATICUSDT': 'matic-network', 'LINKUSDT': 'chainlink', 'LTCUSDT': 'litecoin',
  'UNIUSDT': 'uniswap', 'ATOMUSDT': 'cosmos', 'ETCUSDT': 'ethereum-classic',
  'XLMUSDT': 'stellar', 'NEARUSDT': 'near', 'ALGOUSDT': 'algorand',
  'APTUSDT': 'aptos', 'FILUSDT': 'filecoin', 'ARBUSDT': 'arbitrum',
  'OPUSDT': 'optimism', 'INJUSDT': 'injective-protocol', 'SUIUSDT': 'sui',
  'FETUSDT': 'fetch-ai', 'GRTUSDT': 'the-graph', 'SANDUSDT': 'the-sandbox',
  'MANAUSDT': 'decentraland', 'AAVEUSDT': 'aave', 'MKRUSDT': 'maker',
  'CRVUSDT': 'curve-dao-token', 'RUNEUSDT': 'thorchain', 'HBARUSDT': 'hedera-hashgraph',
  'ICPUSDT': 'internet-computer', 'VETUSDT': 'vechain', 'THETAUSDT': 'theta-token',
  'ZECUSDT': 'zcash', 'FLOWUSDT': 'flow', 'EGLDUSDT': 'elrond-erd-2',
  'FTMUSDT': 'fantom', 'COMPUSDT': 'compound-governance-token', 'SNXUSDT': 'synthetix-network-token',
  'APEUSDT': 'apecoin', 'SEIUSDT': 'sei-network', 'WLDUSDT': 'worldcoin-wld',
  'TIAUSDT': 'celestia', 'ROSEUSDT': 'oasis-network', 'ONEUSDT': 'harmony',
  'KSMUSDT': 'kusama', 'QNTUSDT': 'quant-network'
}

export const TOP_PAIRS = Object.keys(SYMBOL_TO_ID)

// CoinGecko OHLC — 1 day = 30m candles (48 candles)
export async function fetchKlines(symbol) {
  const coinId = SYMBOL_TO_ID[symbol]
  if (!coinId) throw new Error(`Unknown symbol: ${symbol}`)

  const url = `${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=1`

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  })
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`)
  const data = await res.json()

  if (!data || data.length < 10) throw new Error(`Not enough data`)

  return {
    opens:  data.map(k => parseFloat(k[1])),
    highs:  data.map(k => parseFloat(k[2])),
    lows:   data.map(k => parseFloat(k[3])),
    closes: data.map(k => parseFloat(k[4])),
  }
}

// লাইভ প্রাইস
export async function fetchPrice(symbol) {
  const coinId = SYMBOL_TO_ID[symbol]
  if (!coinId) throw new Error(`Unknown symbol: ${symbol}`)
  const url = `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Price fetch error`)
  const json = await res.json()
  return parseFloat(json[coinId].usd)
}
