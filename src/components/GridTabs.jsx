export function GridTabs({ grids, gid, setGid, addGrid, delGrid, rnmGrid, setRnmGrid, rnmVal, setRnmVal, updG }) {
  return (
    <div style={{
      background:'#fff',
      borderBottom:'1px solid rgba(0,0,0,.07)',
      padding:'0 16px',
      display:'flex', alignItems:'stretch',
      overflowX:'auto', flexShrink:0, gap:2,
    }}>
      {grids.map(g => (
        <div key={g.id} style={{ display:'flex', alignItems:'center' }}>
          {rnmGrid && gid === g.id ? (
            <input
              autoFocus
              value={rnmVal}
              onChange={e => setRnmVal(e.target.value)}
              onBlur={() => {
                updG(g.id, gg => ({ ...gg, name: rnmVal || gg.name }))
                setRnmGrid(false)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  updG(g.id, gg => ({ ...gg, name: rnmVal || gg.name }))
                  setRnmGrid(false)
                }
                if (e.key === 'Escape') setRnmGrid(false)
              }}
              style={{
                fontSize:12, fontWeight:500,
                border:'none',
                borderBottom:`2px solid #5DCAA5`,
                outline:'none', padding:'10px 4px',
                background:'transparent', minWidth:90,
              }}
            />
          ) : (
            <button
              onClick={() => setGid(g.id)}
              onDoubleClick={() => { setRnmGrid(true); setRnmVal(g.name); setGid(g.id) }}
              className={`grid-tab${gid === g.id ? ' tab-active' : ''}`}
              style={{
                padding:'11px 14px', fontSize:12,
                fontWeight: gid === g.id ? 600 : 400,
                border:'none',
                borderBottom: gid === g.id ? '2px solid #5DCAA5' : '2px solid transparent',
                background:'transparent',
                cursor:'pointer',
                color: gid === g.id ? '#085041' : '#64748B',
                whiteSpace:'nowrap',
                transition:'color .12s, background .12s',
              }}
              title="Double-cliquer pour renommer"
            >
              {g.name}
            </button>
          )}

          {grids.length > 1 && (
            <button
              onClick={() => delGrid(g.id)}
              title="Supprimer ce planning"
              style={{
                border:'none', background:'transparent',
                cursor:'pointer', color:'#94A3B8',
                fontSize:14, padding:'0 3px 0 0',
                lineHeight:1,
                transition:'color .12s',
              }}
              onMouseEnter={e => e.target.style.color = '#EF4444'}
              onMouseLeave={e => e.target.style.color = '#94A3B8'}
            >×</button>
          )}
        </div>
      ))}

      <button
        onClick={addGrid}
        style={{
          padding:'11px 12px', fontSize:12,
          border:'none', background:'transparent',
          cursor:'pointer', color:'#5DCAA5',
          fontWeight:600, flexShrink:0,
          transition:'color .12s',
        }}
        onMouseEnter={e => e.target.style.color = '#085041'}
        onMouseLeave={e => e.target.style.color = '#5DCAA5'}
      >
        + Nouveau planning
      </button>
    </div>
  )
}
