import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [filter, setFilter] = useState('all')
  const [lastScan, setLastScan] = useState(null)
  const [stats, setStats] = useState({ total: 0, active: 0, tp: 0, sl: 0 })

  const fetchSignals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/signals?status=${filter}&limit=100`)
      const data = await res.json()
      setSignals(data.signals || [])

      // স্ট্যাটস ক্যালকুলেট করো
      const all = data.signals || []
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

  const runScan = async () => {
    setScanning(true)
    try {
      await fetch('/api/scan', { method: 'POST' })
      await fetch('/api/update-pnl', { method: 'POST' })
      setLastScan(new Date().toLocaleTimeString('bn-BD'))
      await fetchSignals()
    } catch (err) {
      console.error(err)
    }
    setScanning(false)
  }

  const updatePnl = async () => {
    await fetch('/api/update-pnl', { method: 'POST' })
    await fetchSignals()
  }

  useEffect(() => {
    fetchSignals()
  }, [fetchSignals])

  // অটো আপডেট প্রতি ৫ মিনিট
  useEffect(() => {
    const interval = setInterval(() => {
      updatePnl()
      fetchSignals()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status) => {
    const map = {
      'ACTIVE': { bg: '#1a3a5c', color: '#4fc3f7', label: '🟡 ACTIVE' },
      'TP_HIT': { bg: '#1a3a1a', color: '#69f0ae', label: '✅ TP HIT' },
      'SL_HIT': { bg: '#3a1a1a', color: '#ef5350', label: '❌ SL HIT' },
    }
    const s = map[status] || { bg: '#333', color: '#fff', label: status }
    return (
      <span style={{
        background: s.bg, color: s.color,
        padding: '2px 8px', borderRadius: '12px',
        fontSize: '11px', fontWeight: 'bold'
      }}>
        {s.label}
      </span>
    )
  }

  const getGradeColor = (grade) => {
    if (grade === 'A+') return '#ffd700'
    if (grade === 'A') return '#69f0ae'
    if (grade === 'B') return '#4fc3f7'
    return '#aaa'
  }

  const getPnlColor = (pnl) => {
    if (pnl > 0) return '#69f0ae'
    if (pnl < 0) return '#ef5350'
    return '#aaa'
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Crypto Signal Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* হেডার */}
      <div className={styles.header}>
        <h1>📊 Crypto Signal Tracker</h1>
        <p>RSI + MACD + Support/Resistance | 15m | TP: 1.5% | SL: 1%</p>
        {lastScan && <p style={{ color: '#aaa', fontSize: '12px' }}>Last scan: {lastScan}</p>}
      </div>

      {/* স্ট্যাটস কার্ড */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.total}</div>
          <div className={styles.statLabel}>Total Signals</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#4fc3f7' }}>
          <div className={styles.statNumber} style={{ color: '#4fc3f7' }}>{stats.active}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#69f0ae' }}>
          <div className={styles.statNumber} style={{ color: '#69f0ae' }}>{stats.tp}</div>
          <div className={styles.statLabel}>TP Hit ✅</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: '#ef5350' }}>
          <div className={styles.statNumber} style={{ color: '#ef5350' }}>{stats.sl}</div>
          <div className={styles.statLabel}>SL Hit ❌</div>
        </div>
      </div>

      {/* বাটন */}
      <div className={styles.controls}>
        <button
          className={styles.scanBtn}
          onClick={runScan}
          disabled={scanning}
        >
          {scanning ? '⏳ Scanning 50 pairs...' : '🔍 Scan Now'}
        </button>
        <button className={styles.refreshBtn} onClick={fetchSignals} disabled={loading}>
          {loading ? '⏳' : '🔄 Refresh'}
        </button>
      </div>

      {/* ফিল্টার */}
      <div className={styles.filters}>
        {['all', 'ACTIVE', 'TP_HIT', 'SL_HIT'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? styles.activeFilter : styles.filterBtn}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* সিগন্যাল টেবিল */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>⏳ Loading signals...</div>
        ) : signals.length === 0 ? (
          <div className={styles.empty}>
            <p>🔍 No signals yet. Click "Scan Now" to start!</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pair</th>
                <th>Signal</th>
                <th>Grade</th>
                <th>Entry Price</th>
                <th>TP</th>
                <th>SL</th>
                <th>RSI</th>
                <th>P&L %</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {signals.map(s => (
                <tr key={s.id} className={styles.row}>
                  <td><strong>{s.symbol.replace('USDT', '/USDT')}</strong></td>
                  <td>
                    <span style={{
                      color: s.signal_type === 'BUY' ? '#69f0ae' : '#ef5350',
                      fontWeight: 'bold'
                    }}>
                      {s.signal_type === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: getGradeColor(s.grade), fontWeight: 'bold' }}>
                      {s.grade}
                    </span>
                  </td>
                  <td>{parseFloat(s.price_at_signal).toFixed(4)}</td>
                  <td style={{ color: '#69f0ae' }}>{parseFloat(s.tp_price).toFixed(4)}</td>
                  <td style={{ color: '#ef5350' }}>{parseFloat(s.sl_price).toFixed(4)}</td>
                  <td>{s.rsi_value}</td>
                  <td style={{ color: getPnlColor(s.pnl_percent), fontWeight: 'bold' }}>
                    {s.pnl_percent > 0 ? '+' : ''}{parseFloat(s.pnl_percent || 0).toFixed(2)}%
                  </td>
                  <td>{getStatusBadge(s.status)}</td>
                  <td style={{ fontSize: '11px', color: '#aaa' }}>
                    {new Date(s.created_at).toLocaleString('en-BD', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.footer}>
        ⚠️ এই সিগন্যাল শুধু তথ্যের জন্য। ট্রেড করার আগে নিজে যাচাই করুন।
      </div>
    </div>
  )
      }
      
