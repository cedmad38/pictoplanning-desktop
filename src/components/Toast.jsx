import { useEffect } from 'react'

const STYLES = {
  success: { bg:'#E1F5EE', color:'#085041', border:'#9FE1CB', icon:'✓' },
  error:   { bg:'#FEE2E2', color:'#991B1B', border:'#FCA5A5', icon:'✗' },
  info:    { bg:'#EBF2FD', color:'#1E3A8A', border:'#93C5FD', icon:'ℹ' },
}

export function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])

  const s = STYLES[type] || STYLES.success
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:9999,
      padding:'11px 18px', borderRadius:11,
      background:s.bg, color:s.color,
      border:`1px solid ${s.border}`,
      boxShadow:'0 4px 20px rgba(0,0,0,.11)',
      fontSize:13, fontWeight:600,
      display:'flex', alignItems:'center', gap:8,
      animation:'toastUp .2s ease',
    }}>
      <span style={{ fontSize:15 }}>{s.icon}</span>
      {message}
    </div>
  )
}
