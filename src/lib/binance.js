// CryptoCompare API — কোনো geo-restriction নেই, সম্পূর্ণ ফ্রি
const CC_BASE = 'https://min-api.cryptocompare.com/data'

// Symbol map — CryptoCompare শুধু base symbol চেনে
const PAIRS = [
  'BTC','ETH','BNB','SOL','XRP','ADA','DOGE','AVAX','DOT','MATIC',
  'LINK','LTC','UNI','ATOM','ETC','XLM','NEAR','ALGO','APT','FIL',
  'ARB','OP','INJ','SUI','SEI','TIA','WLD','FET','GRT','SAND',
  'MANA','APE','AAVE','MKR','SNX','COMP','CRV','RUNE','FTM','HBAR',
  'EGLD','FLOW','ICP','VET','THETA','QNT','KSM','ZEC','ONE','ROSE',
  'GALA','CHZ','ENJ','BAT','ZIL','WAVES','DASH','XMR','NEO','ONT',
  'IOST','ICX','ZEN','XTZ','EOS','TRX','IOTA','STORJ','SKL','ANKR',
  'BAND','KNC','BAL','YFI','SUSHI','ALPHA','LIT','STX','CFX','WOO',
  'PEPE','SHIB','FLOKI','BONK','WIF','MEME','RNDR','IMX','GMt','STG',
  'LDO','RPL','SSV','OM','PENDLE','TRB','UMA','AGIX','OCEAN','NMR',
  'GMX','DYDX','MAGIC','HIGH','WOO','ACH','ID','KAS','TON','PYTH',
  'JUP','STRK','ALT','DYM','PIXEL','AI','MANTA','ZK','ZRO','ENA',
  'ORDI','SATS','RONIN','RON','ACE','CYBER','ARKM','JASMAY','OM','BLUR',
  'RDNT','CVX','FXS','LQT','UFT','LQTY','HFT','PHB','AMB','HOOK',
  'AUDIO','CELR','DENT','HOT','WIN','SUN','BTT','JST','NKN','SC',
  'DGB','RVN','MTL','STMX','RIF','AKRO','CTK','UNFI','OXT','PAXG',
  'RLC','MDT','DOCK','PERL','LRC','COTI','CTSI','TRU','BOND','LPT',
  'PERP','BAD','DIA','LINA','POLS','DEXE','PRQ','GTC','POW','IDEX',
  'FIDA','STEP','GENE','MEDIA','MNGO','SAMO','RAY','SRM','COPE','OXY'
]

export const TOP_PAIRS = PAIRS.map(s => `${s}USDT`)

// CryptoCompare থেকে 30m OHLCV data
export async function fetchKlines(symbol) {
  const base = symbol.replace('USDT', '')
  const url = `${CC_BASE}/v2/histominute?fsym=${base}&tsym=USDT&limit=100&aggregate=30`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`CC error: ${res.status}`)
  const json = await res.json()

  if (json.Response === 'Error') throw new Error(`CC: ${json.Message}`)
  const data = json.Data?.Data
  if (!data || data.length < 40) throw new Error(`Not enough data for ${base}`)

  return {
    opens:  data.map(k => k.open),
    highs:  data.map(k => k.high),
    lows:   data.map(k => k.low),
    closes: data.map(k => k.close),
  }
}

// লাইভ প্রাইস
export async function fetchPrice(symbol) {
  const base = symbol.replace('USDT', '')
  const url = `${CC_BASE}/price?fsym=${base}&tsyms=USDT`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Price fetch error`)
  const json = await res.json()
  if (!json.USDT) throw new Error(`No price for ${base}`)
  return parseFloat(json.USDT)
}
