import { useState, useRef, useCallback } from 'react'
import { ARASAAC_SEARCH, ARASAAC_IMG, QUICK_CATS } from '../constants'
import { mkArasaac } from '../utils'
import { LocalGalleryTab } from './LocalGalleryTab'
import { PhotoTab } from './PhotoTab'

export function LibraryPanel({ target, onClose, onAddPicto }) {
  const [tab,      setTab]     = useState('arasaac')
  const [query,    setQuery]   = useState('')
  const [results,  setResults] = useState([])
  const [loading,  setLoading] = useState(false)
  const [searched, setSearched]= useState(false)
  const [cat,      setCat]     = useState(null)
  const abortRef = useRef(null)

  const doSearch = useCallback(async q => {
    if (!q.trim()) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true); setSearched(true); setResults([])
    try {
      const res  = await fetch(ARASAAC_SEARCH(q), { signal:ctrl.signal })
      const data = await res.json()
      setResults(Array.isArray(data) ? data.slice(0, 40) : [])
    } catch(e) { if (e.name !== 'AbortError') setResults([]) }
    finally { setLoading(false) }
  }, [])

  const searchCat = async c => {
    setCat(c.label); setLoading(true); setSearched(true)
    abortRef.current?.abort()
    const seen = [], merged = []
    for (const term of c.terms) {
      try {
        const r = await fetch(ARASAAC_SEARCH(term))
        const d = await r.json()
        if (Array.isArray(d)) d.slice(0,8).forEach(p => {
          if (!seen.includes(p._id)) { seen.push(p._id); merged.push(p) }
        })
      } catch {}
    }
    setResults(merged.slice(0, 40)); setLoading(false)
  }

  const TABS = [
    { id:'arasaac', label:'ARASAAC', icon:'🔍' },
    { id:'local',   label:'Galerie',  icon:'📁' },
    { id:'photo',   label:'Photo',    icon:'🖼' },
  ]

  return (
    <aside className="slide-right" style={{
      width:300, background:'#fff',
      borderLeft:'1px solid rgba(0,0,0,.07)',
      display:'flex', flexDirection:'column',
      overflow:'hidden', flexShrink:0,
    }}>
      {/* En-tête */}
      <div style={{
        padding:'12px 14px 0',
        borderBottom:'1px solid rgba(0,0,0,.07)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#1A1D23' }}>🧩 Bibliothèque</div>
            <div style={{
              fontSize:10, marginTop:4,
              color: target ? '#085041' : '#64748B',
              background: target ? '#E1F5EE' : 'transparent',
              padding: target ? '1px 6px' : '0',
              borderRadius: target ? 8 : 0,
              border: target ? '1px solid #9FE1CB' : 'none',
              display:'inline-block',
            }}>
              {target ? `→ Ligne ${target.r+1}, Colonne ${target.c+1}` : 'Sélectionnez une cellule (+)'}
            </div>
          </div>
          <button onClick={onClose} style={{
            border:'none', background:'transparent',
            cursor:'pointer', color:'#94A3B8', fontSize:20,
            padding:0, lineHeight:1, transition:'color .12s',
          }}
            onMouseEnter={e => e.target.style.color = '#1A1D23'}
            onMouseLeave={e => e.target.style.color = '#94A3B8'}
          >×</button>
        </div>

        {/* Onglets */}
        <div style={{ display:'flex' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:'9px 2px',
              border:'none',
              borderBottom: tab===t.id ? '2px solid #5DCAA5' : '2px solid transparent',
              background:'transparent',
              cursor:'pointer', fontSize:11,
              fontWeight: tab===t.id ? 700 : 400,
              color: tab===t.id ? '#085041' : '#64748B',
              whiteSpace:'nowrap',
              transition:'color .12s',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Onglet ARASAAC ──────────────────────────────────────── */}
      {tab === 'arasaac' && <>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid rgba(0,0,0,.06)' }}>
          <div style={{ display:'flex', gap:6 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter') { setCat(null); doSearch(query) } }}
              placeholder="Chercher en français…"
              style={{
                flex:1, fontSize:12, padding:'7px 10px', borderRadius:8,
                border:'1px solid rgba(0,0,0,.1)', outline:'none',
                background:'#F5F6F9',
                transition:'border-color .12s',
              }}
              onFocus={e => e.target.style.borderColor = '#5DCAA5'}
              onBlur={e  => e.target.style.borderColor = 'rgba(0,0,0,.1)'}
            />
            <button
              onClick={() => { setCat(null); doSearch(query) }}
              style={{
                padding:'7px 11px', borderRadius:8,
                border:'1px solid #9FE1CB',
                background:'#E1F5EE', color:'#085041',
                cursor:'pointer', fontSize:13, fontWeight:600,
              }}
            >🔍</button>
          </div>
          <div style={{ fontSize:9, color:'#94A3B8', marginTop:4 }}>
            +14 000 pictogrammes ARASAAC (connexion internet requise)
          </div>
        </div>

        {/* Catégories rapides */}
        <div style={{
          padding:'6px 10px 5px', borderBottom:'1px solid rgba(0,0,0,.06)',
          display:'flex', gap:4, flexWrap:'wrap',
        }}>
          {QUICK_CATS.map(c => (
            <button key={c.label} onClick={() => searchCat(c)} style={{
              padding:'3px 9px', borderRadius:20, fontSize:10, cursor:'pointer',
              border: cat===c.label ? '1px solid #9FE1CB' : '1px solid rgba(0,0,0,.1)',
              background: cat===c.label ? '#E1F5EE' : '#F5F6F9',
              color: cat===c.label ? '#085041' : '#64748B',
              fontWeight: cat===c.label ? 700 : 400,
              transition:'background .12s',
            }}>{c.label}</button>
          ))}
        </div>

        {/* Résultats */}
        <div style={{ flex:1, overflow:'auto', padding:8 }}>
          {loading && <Spinner label="Chargement ARASAAC…" />}
          {!loading && searched && results.length===0 && (
            <EmptyState icon="🔍" title="Aucun résultat" sub="Essayez un autre mot ou une catégorie" />
          )}
          {!loading && !searched && (
            <EmptyState icon="🔍" title="Chercher un pictogramme" sub="Tapez un mot ou choisissez une catégorie ci-dessus" />
          )}
          {!loading && results.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
              {results.map(p => {
                const lbl = p.keywords?.[0]?.keyword || `#${p._id}`
                return (
                  <button
                    key={p._id}
                    onClick={() => target && onAddPicto(mkArasaac(p._id, lbl))}
                    className="lib-btn"
                    title={lbl}
                    disabled={!target}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center',
                      gap:3, padding:'7px 3px 5px', borderRadius:9,
                      border:'1px solid rgba(0,0,0,.09)',
                      background: target ? '#F5F6F9' : '#ECEEF3',
                      cursor: target ? 'pointer' : 'not-allowed',
                      opacity: target ? 1 : .4,
                    }}
                  >
                    <img src={ARASAAC_IMG(p._id)} alt={lbl}
                      style={{ width:40, height:40, objectFit:'contain' }}
                      onError={e => { e.currentTarget.style.opacity='.2' }}
                    />
                    <span style={{
                      fontSize:8, color:'#64748B', textAlign:'center',
                      maxWidth:52, overflow:'hidden', textOverflow:'ellipsis',
                      whiteSpace:'nowrap', width:'100%',
                    }}>{lbl}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div style={{
          padding:'5px 14px', borderTop:'1px solid rgba(0,0,0,.06)',
          fontSize:9, color:'#94A3B8', textAlign:'center',
        }}>
          © Sergio Palao / ARASAAC – CC BY-NC-SA 4.0
        </div>
      </>}

      {tab === 'local' && <LocalGalleryTab target={target} onAddPicto={onAddPicto} />}
      {tab === 'photo' && <PhotoTab        target={target} onAddPicto={onAddPicto} />}
    </aside>
  )
}

/* ── Sous-composants partagés ────────────────────────────────────── */
function Spinner({ label }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', gap:10 }}>
      <div style={{
        width:28, height:28, borderRadius:'50%',
        border:'3px solid #E1F5EE', borderTop:'3px solid #5DCAA5',
        animation:'spin .75s linear infinite',
      }} />
      {label && <span style={{ fontSize:11, color:'#64748B' }}>{label}</span>}
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign:'center', padding:'2rem', color:'#64748B', fontSize:12 }}>
      <div style={{ fontSize:32, marginBottom:10 }}>{icon}</div>
      <div style={{ fontWeight:600, marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:10, color:'#94A3B8' }}>{sub}</div>
    </div>
  )
}
