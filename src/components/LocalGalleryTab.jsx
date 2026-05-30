import { useState } from 'react'
import { localFileUrl, mkPhoto } from '../utils'
import { isElectron } from '../constants'

export function LocalGalleryTab({ target, onAddPicto }) {
  const [folder,  setFolder]  = useState(null)
  const [images,  setImages]  = useState([])
  const [loading, setLoading] = useState(false)
  const [subFlt,  setSubFlt]  = useState(null)
  const [query,   setQuery]   = useState('')

  const openFolder = async () => {
    const f = await window.electronAPI.openFolder()
    if (!f) return
    setLoading(true); setFolder(f); setSubFlt(null); setQuery('')
    const imgs = await window.electronAPI.readFolderImages(f)
    setImages(imgs); setLoading(false)
  }

  const addPicto = async img => {
    if (!target) return
    const b64 = await window.electronAPI.readFileAsBase64(img.path)
    if (!b64) return
    const ext  = img.path.split('.').pop().toLowerCase()
    const mime = { png:'image/png', gif:'image/gif', webp:'image/webp', svg:'image/svg+xml' }[ext] || 'image/jpeg'
    onAddPicto(mkPhoto(`data:${mime};base64,${b64}`, img.name))
  }

  if (!isElectron) return (
    <div style={{ padding:'2rem', textAlign:'center', color:'#64748B', fontSize:12 }}>
      Galerie locale disponible uniquement dans l'application installée.
    </div>
  )

  const subs    = [...new Set(images.map(i => i.subfolder).filter(Boolean))]
  const filtered = images.filter(img => {
    const okSub = !subFlt || img.subfolder === subFlt
    const okQ   = !query  || img.name.toLowerCase().includes(query.toLowerCase())
    return okSub && okQ
  })

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Choisir dossier */}
      <div style={{ padding:'8px 10px', borderBottom:'1px solid rgba(0,0,0,.06)' }}>
        <button onClick={openFolder} style={{
          width:'100%', padding:'10px', borderRadius:9,
          border:'1px solid #9FE1CB', background:'#E1F5EE',
          color:'#085041', cursor:'pointer', fontSize:12, fontWeight:600,
          transition:'background .12s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='#d4efdf'}
          onMouseLeave={e => e.currentTarget.style.background='#E1F5EE'}
        >
          📁 {folder ? 'Changer de dossier' : 'Choisir un dossier de pictos'}
        </button>
        {folder && !loading && (
          <div style={{ fontSize:10, color:'#94A3B8', marginTop:4, textAlign:'center' }}>
            {images.length} image{images.length>1?'s':''}{subs.length>0?` • ${subs.length} catégorie${subs.length>1?'s':''}`:' • dossier plat'}
          </div>
        )}
      </div>

      {/* Recherche */}
      {images.length > 0 && (
        <div style={{ padding:'6px 10px 4px', borderBottom:'1px solid rgba(0,0,0,.06)' }}>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher…"
            style={{
              width:'100%', fontSize:12, padding:'5px 9px', borderRadius:7,
              border:'1px solid rgba(0,0,0,.1)', outline:'none',
              background:'#F5F6F9', boxSizing:'border-box',
              transition:'border-color .12s',
            }}
            onFocus={e => e.target.style.borderColor = '#5DCAA5'}
            onBlur={e  => e.target.style.borderColor = 'rgba(0,0,0,.1)'}
          />
        </div>
      )}

      {/* Filtres sous-dossiers */}
      {subs.length > 0 && (
        <div style={{
          padding:'5px 8px 4px', borderBottom:'1px solid rgba(0,0,0,.06)',
          display:'flex', gap:4, flexWrap:'wrap',
        }}>
          <FilterChip active={!subFlt} onClick={() => setSubFlt(null)}>Tous</FilterChip>
          {subs.map(sf => (
            <FilterChip key={sf} active={subFlt===sf} onClick={() => setSubFlt(sf===subFlt?null:sf)}>
              {sf.split('/').pop()}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Contenu */}
      <div style={{ flex:1, overflow:'auto', padding:8 }}>
        {loading && <Spinner label="Lecture du dossier…" />}

        {!loading && !folder && (
          <EmptyState icon="📁" title="Choisissez un dossier" sub="PNG, JPG, SVG acceptés — sous-dossiers supportés" />
        )}

        {!loading && folder && filtered.length === 0 && (
          <EmptyState icon="🔍" title="Aucun résultat" sub="Essayez un autre filtre ou terme de recherche" />
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
            {filtered.map(img => (
              <button
                key={img.path}
                onClick={() => addPicto(img)}
                className="lib-btn"
                title={img.name}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center',
                  gap:3, padding:'7px 3px 5px', borderRadius:9,
                  border:'1px solid rgba(0,0,0,.09)',
                  background: target ? '#F5F6F9' : '#ECEEF3',
                  cursor: target ? 'pointer' : 'not-allowed',
                  opacity: target ? 1 : .45,
                }}
              >
                <img
                  src={localFileUrl(img.path)} alt={img.name}
                  style={{ width:40, height:40, objectFit:'contain' }}
                  onError={e => { e.currentTarget.style.opacity='.2' }}
                />
                <span style={{
                  fontSize:8, color:'#64748B', textAlign:'center',
                  maxWidth:52, overflow:'hidden', textOverflow:'ellipsis',
                  whiteSpace:'nowrap', width:'100%',
                }}>{img.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{
        padding:'5px 14px', borderTop:'1px solid rgba(0,0,0,.06)',
        fontSize:9, color:'#94A3B8', textAlign:'center',
      }}>
        Vos images personnelles
      </div>
    </div>
  )
}

/* ── Sous-composants ─────────────────────────────────────────────── */

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding:'2px 8px', borderRadius:20, fontSize:10, cursor:'pointer',
      border: active ? '1px solid #9FE1CB' : '1px solid rgba(0,0,0,.1)',
      background: active ? '#E1F5EE' : '#F5F6F9',
      color: active ? '#085041' : '#64748B',
      fontWeight: active ? 600 : 400,
      transition:'background .12s',
    }}>{children}</button>
  )
}

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
