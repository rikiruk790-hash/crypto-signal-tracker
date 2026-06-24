import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

export default function Home() {
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [filter, setFilter] = useState('all')
  const [lastScan, setLastScan] = useState(null)
  const [nextScan, setNextScan] = useState(30 * 60)
  const [stats, setStats] = useState({ total: 0, active: 0, tp: 0, sl: 0 })
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchSignals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/signals?status=${filter}&limit=100`)
      const data = await res.json()
      const all = data.signals || []
      setSignals(all)
      setStats({
        total: all.length,
        active: all.filter(s => s.status === 'ACTIVE').length,
        tp: all.filter(s => s.status === 'TP_HIT').length,
        sl: all.filter(s => s.status === 'SL_HIT').length,
      })
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [filter])

  const runScan = useCallback(async (auto = false) => {
    if (scanning) return
    setScanning(true)
    try {
      const res = await fetch('/api/scan', { method: 'POST' })
      const data = await res.json()
      await fetch('/api/update-pnl', { method: 'POST' })
      setLastScan(new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }))
      setNextScan(30 * 60)
      await fetchSignals()
      if (data.newSignals > 0) {
        showToast(`🎯 ${data.newSignals}টা নতুন সিগন্যাল!`)
      } else if (auto) {
        showToast('🔍 Auto scan — নতুন সিগন্যাল নেই', 'info')
      }
    } catch (err) {
      showToast('❌ Scan error', 'error')
    }
    setScanning(false)
  }, [scanning, fetchSignals])

  // অটো স্ক্যান — প্রতি ৩০ মিনিট
  useEffect(() => {
    const scanInterval = setInterval(() => {
      runScan(true)
    }, 30 * 60 * 1000)
    return () => clearInterval(scanInterval)
  }, [runScan])

  // কাউন্টডাউন টাইমার
  useEffect(() => {
    const timer = setInterval(() => {
      setNextScan(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // PnL অটো আপডেট — প্রতি ৫ মিনিট
  useEffect(() => {
    const pnlInterval = setInterval(async () => {
      await fetch('/api/update-pnl', { method: 'POST' })
      await fetchSignals()
    }, 5 * 60 * 1000)
    return () => clearInterval(pnlInterval)
  }, [fetchSignals])

  useEffect(() => {
    fetchSignals()
  }, [fetchSignals])

  const formatCountdown = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const getSignalColor = (type) => type === 'BUY' ? '#00e676' : '#ff5252'
  const getGradeColor = (g) => ({ 'A+': '#ffd700', 'A': '#00e676', 'B': '#40c4ff' }[g] || '#aaa')
  const getPnlColor = (p) => p > 0 ? '#00e676' : p < 0 ? '#ff5252' : '#aaa'

  const getStatusStyle = (status) => ({
    'ACTIVE':  { bg: '#0d2137', color: '#40c4ff', label: '🟡 ACTIVE' },
    'TP_HIT':  { bg: '#0d2b0d', color: '#00e676', label: '✅ TP HIT' },
    'SL_HIT':  { bg: '#2b0d0d', color: '#ff5252', label: '❌ SL HIT' },
  }[status] || { bg: '#222', color: '#fff', label: status })

  return (
    <>
      <Head>
        <title>Crypto Signal Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#080c18', color: '#e0e0e0', fontFamily: 'Segoe UI, sans-serif', padding: '12px' }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: toast.type === 'error' ? '#b71c1c' : toast.type === 'info' ? '#1565c0' : '#1b5e20',
            color: '#fff', padding: '10px 20px', borderRadius: 24,
            fontSize: 13, fontWeight: 'bold', zIndex: 999, whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', padding: '16px 0 12px', borderBottom: '1px solid #1a2535', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, color: '#fff', margin: 0 }}>📊 Crypto Signal Tracker</h1>
          <p style={{ color: '#546e7a', fontSize: 11, margin: '4px 0 0' }}>RSI + MACD + S/R | 30m | TP: 1.5% | SL: 1%</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 6 }}>
            {lastScan && <span style={{ color: '#546e7a', fontSize: 11 }}>Last: {lastScan}</span>}
            <span style={{ color: nextScan < 60 ? '#ff5252' : '#40c4ff', fontSize: 11, fontWeight: 'bold' }}>
              ⏱ Next: {formatCountdown(nextScan)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Total', value: stats.total, color: '#fff' },
            { label: 'Active', value: stats.active, color: '#40c4ff' },
            { label: 'TP ✅', value: stats.tp, color: '#00e676' },
            { label: 'SL ❌', value: stats.sl, color: '#ff5252' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0d1526', border: `1px solid ${s.color}22`, borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#546e7a', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => runScan(false)} disabled={scanning} style={{
            flex: 1, background: scanning ? '#1a2535' : 'linear-gradient(135deg,#1565c0,#0d47a1)',
            color: '#fff', border: 'none', borderRadius: 10, padding: '12px',
            fontSize: 14, fontWeight: 'bold', cursor: scanning ? 'not-allowed' : 'pointer'
          }}>
            {scanning ? '⏳ Scanning...' : '🔍 Scan Now'}
          </button>
          <button onClick={fetchSignals} disabled={loading} style={{
            background: '#0d1526', color: '#40c4ff', border: '1px solid #1a2535',
            borderRadius: 10, padding: '12px 16px', fontSize: 13, cursor: 'pointer'
          }}>
            {loading ? '⏳' : '🔄'}
          </button>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
          {['all', 'ACTIVE', 'TP_HIT', 'SL_HIT'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? '#1565c0' : '#0d1526',
              color: filter === f ? '#fff' : '#546e7a',
              border: `1px solid ${filter === f ? '#1565c0' : '#1a2535'}`,
              borderRadius: 20, padding: '6px 14px', fontSize: 12,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
            }}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Signal Cards — মোবাইল ফ্রেন্ডলি */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#546e7a' }}>⏳ Loading...</div>
        ) : signals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#546e7a' }}>
            <div style={{ fontSize: 40 }}>🔍</div>
            <p style={{ marginTop: 8 }}>No signals yet. Click "Scan Now"!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {signals.map(s => {
              const st = getStatusStyle(s.status)
              return (
                <div key={s.id} style={{
                  background: '#0d1526', border: '1px solid #1a2535',
                  borderRadius: 12, padding: '12px 14px',
                  borderLeft: `3px solid ${getSignalColor(s.signal_type)}`
                }}>
                  {/* Row 1: Pair + Signal + Grade + Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 'bold', fontSize: 15, color: '#fff' }}>
                        {s.symbol.replace('USDT', '/USDT')}
                      </span>
                      <span style={{ color: getSignalColor(s.signal_type), fontWeight: 'bold', fontSize: 13 }}>
                        {s.signal_type === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
                      </span>
                      <span style={{ color: getGradeColor(s.grade), fontSize: 12, fontWeight: 'bold' }}>
                        [{s.grade}]
                      </span>
                    </div>
                    <span style={{
                      background: st.bg, color: st.color,
                      padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 'bold'
                    }}>
                      {st.label}
                    </span>
                  </div>

                  {/* Row 2: Prices */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
                    {[
                      { label: 'Entry', value: parseFloat(s.price_at_signal).toFixed(2) },
                      { label: 'TP', value: parseFloat(s.tp_price).toFixed(2), color: '#00e676' },
                      { label: 'SL', value: parseFloat(s.sl_price).toFixed(2), color: '#ff5252' },
                    ].map(p => (
                      <div key={p.label} style={{ background: '#080c18', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#546e7a' }}>{p.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 'bold', color: p.color || '#fff' }}>{p.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Row 3: RSI + PnL + Time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#546e7a' }}>RSI: <span style={{ color: '#fff' }}>{s.rsi_value}</span></span>
                    <span style={{ fontSize: 14, fontWeight: 'bold', color: getPnlColor(s.pnl_percent) }}>
                      {s.pnl_percent > 0 ? '+' : ''}{parseFloat(s.pnl_percent || 0).toFixed(2)}%
                    </span>
                    <span style={{ fontSize: 10, color: '#546e7a' }}>
                      {new Date(s.created_at).toLocaleString('en-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '20px 0', color: '#2a3545', fontSize: 11, marginTop: 8 }}>
          ⚠️ সিগন্যাল শুধু তথ্যের জন্য। ট্রেড করার আগে নিজে যাচাই করুন।
        </div>
      </div>
    </>
  )
    }
    
