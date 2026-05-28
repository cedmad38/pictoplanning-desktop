/**
 * PictoPlanning Desktop By Cedmad — V1.0
 * Electron + React + Vite
 *
 * Galerie : ARASAAC (API) + dossier local
 * Photos  : sélecteur de fichier PC
 * Export  : impression native + sauvegarde JSON
 */

import { useState, useRef, useCallback } from 'react'

/* ── ARASAAC ─────────────────────────────────────────────────────── */
const ARASAAC_SEARCH = q =>
  `https://api.arasaac.org/api/pictograms/fr/search/${encodeURIComponent(q)}`
const ARASAAC_IMG = id =>
  `https://static.arasaac.org/pictograms/${id}/${id}_500.png`

const QUICK_CATS = [
  { label:'🌅 Matin',     terms:['réveil','douche','habillage','dents','école'] },
  { label:'🍽 Repas',     terms:['manger','déjeuner','boire','fruits','goûter'] },
  { label:'🎨 Activités', terms:['jeu','dessin','sport','musique','lecture'] },
  { label:'🌙 Soirée',    terms:['pyjama','bain','dodo','histoire','nuit'] },
  { label:'😊 Émotions',  terms:['content','triste','colère','peur','calme'] },
  { label:'🏠 Lieux',     terms:['maison','école','médecin','voiture','magasin'] },
  { label:'🧼 Hygiène',   terms:['savon','brosse','toilette','peigne','serviette'] },
  { label:'📅 Temps',     terms:['matin','après-midi','soir','lundi','attendre'] },
]

/* ── Palette de couleurs ─────────────────────────────────────────── */
const PALETTE = [
  '#FFF9F0','#E1F5EE','#E6F1FB','#FAEEDA',
  '#FBEAF0','#EAF3DE','#FAECE7','#F1EFE8',
  '#EDE7F6','#E8F5E9','#FFF8E1','#E3F2FD',
]
const PAL_NAMES = [
  'Blanc chaud','Menthe','Bleu ciel','Pêche',
  'Rose','Vert tendre','Corail','Gris doux',
  'Lilas','Sauge','Miel','Azur',
]

/* ── Helpers ─────────────────────────────────────────────────────── */
let _id = 0
const nid  = () => String(++_id)
const rndC = () => PALETTE[Math.floor(Math.random() * PALETTE.length)]
const CM   = 37.795

const mkArasaac = (id, label) => ({ uid:nid(), arasaacId:id, label, color:rndC() })
const mkEmoji   = (e, l, col) => ({ uid:nid(), emoji:e, label:l, color:col||rndC() })
const mkPhoto   = (data, label) => ({ uid:nid(), imageData:data, label:label||'Photo', color:rndC() })

/* Convertit un chemin local en URL local-file:// */
const localFileUrl = filePath => {
  const normalized = filePath.replace(/\\/g, '/')
  return `local-file://${normalized.startsWith('/') ? '' : '/'}${normalized}`
}

/* Recadrage carré via canvas */
const squareCrop = dataUrl => new Promise(res => {
  const img = new Image()
  img.onload = () => {
    const s = Math.min(img.width, img.height)
    const c = document.createElement('canvas')
    c.width = c.height = s
    c.getContext('2d').drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, s, s)
    res(c.toDataURL('image/jpeg', 0.85))
  }
  img.src = dataUrl
})

/* Redimensionner sans recadrer */
const resizeOnly = (dataUrl, maxSize=900) => new Promise(res => {
  const img = new Image()
  img.onload = () => {
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    c.getContext('2d').drawImage(img, 0, 0, w, h)
    res(c.toDataURL('image/jpeg', 0.85))
  }
  img.src = dataUrl
})

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

/* ── PictoCell ───────────────────────────────────────────────────── */
function PictoCell({ cell, sz, szH }) {
  if (!cell) return null
  const h   = szH ?? sz
  const fit = cell.imageMode === 'contain'
  const s   = { width:sz*0.86, height:h*0.86, objectFit:'contain', display:'block', pointerEvents:'none' }
  if (cell.imageData) return (
    <img src={cell.imageData} alt={cell.label} draggable={false}
      style={{ ...s, objectFit:fit?'contain':'cover', borderRadius:fit?4:6 }} />
  )
  if (cell.arasaacId) return (
    <img src={ARASAAC_IMG(cell.arasaacId)} alt={cell.label} draggable={false}
      style={s} onError={e => { e.currentTarget.style.opacity='0.3' }} />
  )
  return <span style={{ fontSize:sz*0.48, lineHeight:1, pointerEvents:'none' }}>{cell.emoji}</span>
}

/* ── PhotoTab ────────────────────────────────────────────────────── */
function PhotoTab({ target, onAddPicto, T }) {
  const [step,         setStep]        = useState('choose')
  const [capturedProc, setCapturedProc]= useState(null)
  const [fitMode,      setFitMode]     = useState(false)
  const [label,        setLabel]       = useState('')
  const [color,        setColor]       = useState(rndC())
  const fileInputRef = useRef(null)

  const handleDataUrl = async dataUrl => {
    const proc = fitMode ? await resizeOnly(dataUrl) : await squareCrop(dataUrl)
    setCapturedProc(proc)
    setColor(rndC())
    setLabel('')
    setStep('preview')
  }

  const openFile = async () => {
    if (isElectron) {
      const result = await window.electronAPI.openImageFile()
      if (result) await handleDataUrl(result.dataUrl)
    } else {
      fileInputRef.current?.click()
    }
  }

  const onFileChange = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => { await handleDataUrl(ev.target.result) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const confirm = () => {
    if (!target || !capturedProc) return
    const cell = mkPhoto(capturedProc, label || 'Photo')
    if (fitMode) cell.imageMode = 'contain'
    onAddPicto(cell)
    reset()
  }

  const reset = () => {
    setCapturedProc(null)
    setLabel('')
    setStep('choose')
  }

  const ModeToggle = () => (
    <div style={{ display:'flex', borderRadius:10, overflow:'hidden', border:'1px solid #e0e0e0', width:'100%' }}>
      <button onClick={() => setFitMode(false)} style={{
        flex:1, padding:'7px 0', border:'none', fontSize:11,
        fontWeight:fitMode?400:600, background:fitMode?'#f8f8f8':T.mintL,
        color:fitMode?'#888':T.mintD, cursor:'pointer',
      }}>⬛ Recadrer</button>
      <button onClick={() => setFitMode(true)} style={{
        flex:1, padding:'7px 0', border:'none', fontSize:11,
        fontWeight:fitMode?600:400, background:fitMode?'#E8F0FE':'#f8f8f8',
        color:fitMode?'#2B7BE9':'#888', cursor:'pointer',
      }}>🖼 Plein cadre</button>
    </div>
  )

  if (step === 'choose') return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', gap:14, padding:'1.5rem 1rem' }}>
      {!target && <div style={{ fontSize:11, color:T.sub, textAlign:'center' }}>
        Sélectionnez d'abord une cellule (+)
      </div>}
      <div style={{ width:200 }}>
        <div style={{ fontSize:11, color:T.sub, marginBottom:5, textAlign:'center' }}>Format</div>
        <ModeToggle />
        <div style={{ fontSize:9, color:'#aaa', textAlign:'center', marginTop:4 }}>
          {fitMode ? 'Image entière sans rognage' : 'Image rognée en carré'}
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display:'none' }} />
      <button onClick={openFile} disabled={!target} style={{
        width:200, padding:'14px 0', borderRadius:14,
        cursor:target?'pointer':'not-allowed',
        border:`1.5px solid ${target?T.mint:'#ddd'}`,
        background:target?T.mintL:'#f5f5f5',
        color:target?T.mintD:'#aaa',
        display:'flex', flexDirection:'column', alignItems:'center', gap:8,
      }}>
        <span style={{ fontSize:36 }}>🖼</span>
        <span style={{ fontSize:13, fontWeight:500 }}>Choisir une image</span>
        <span style={{ fontSize:10, opacity:0.7 }}>Depuis votre ordinateur</span>
      </button>
    </div>
  )

  if (step === 'preview') return (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, padding:'0.8rem' }}>
      <div style={{ display:'flex', justifyContent:'center' }}>
        <div style={{ width:130, height:130, borderRadius:14, overflow:'hidden',
          border:`2px solid ${fitMode?'#2B7BE9':T.mint}`, background:color }}>
          {capturedProc && <img src={capturedProc} alt="Aperçu"
            style={{ width:'100%', height:'100%', objectFit:fitMode?'contain':'cover' }} />}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        <span style={{ fontSize:12, fontWeight:500, color:'#333' }}>Nom du pictogramme</span>
        <input type="text" value={label} onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key==='Enter' && confirm()}
          placeholder="Ex : Piscine, Mamie…"
          style={{ fontSize:15, padding:'10px 12px', borderRadius:10,
            border:`2px solid ${T.mint}`, outline:'none',
            width:'100%', boxSizing:'border-box' }}
        />
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
        <span style={{ fontSize:11, color:'#888' }}>Couleur de fond</span>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'center' }}>
          {PALETTE.map(p => (
            <button key={p} onClick={() => setColor(p)} style={{
              width:22, height:22, borderRadius:6, background:p,
              border:color===p?`2px solid ${T.mint}`:'0.5px solid rgba(0,0,0,0.15)',
              cursor:'pointer', padding:0,
            }} />
          ))}
        </div>
      </div>
      <div style={{ display:'flex', gap:8, paddingBottom:10 }}>
        <button onClick={reset} style={{ flex:1, padding:'11px 0', borderRadius:10,
          border:'0.5px solid #ddd', background:'#f5f5f5', cursor:'pointer', fontSize:12, color:'#888' }}>
          ↩ Recommencer
        </button>
        <button onClick={confirm} disabled={!target} style={{
          flex:2, padding:'11px 0', borderRadius:10, border:'none',
          background:target?(fitMode?'#E8F0FE':T.mintL):'#f0f0f0',
          color:target?(fitMode?'#2B7BE9':T.mintD):'#aaa',
          cursor:target?'pointer':'not-allowed', fontSize:13, fontWeight:600,
        }}>{target ? '✓ Ajouter à la grille' : '⚠ Choisir une cellule'}</button>
      </div>
    </div>
  )

  return null
}

/* ── LocalGalleryTab ─────────────────────────────────────────────── */
function LocalGalleryTab({ target, onAddPicto, T }) {
  const [folderPath,   setFolderPath]  = useState(null)
  const [images,       setImages]      = useState([])
  const [loading,      setLoading]     = useState(false)
  const [activeFolder, setActiveFolder]= useState(null)
  const [query,        setQuery]       = useState('')

  const openFolder = async () => {
    const folder = await window.electronAPI.openFolder()
    if (!folder) return
    setLoading(true)
    setFolderPath(folder)
    setActiveFolder(null)
    setQuery('')
    const imgs = await window.electronAPI.readFolderImages(folder)
    setImages(imgs)
    setLoading(false)
  }

  const addPicto = async img => {
    if (!target) return
    const b64 = await window.electronAPI.readFileAsBase64(img.path)
    if (!b64) return
    const ext  = img.path.split('.').pop().toLowerCase()
    const mime = { png:'image/png', gif:'image/gif', webp:'image/webp', svg:'image/svg+xml' }[ext] || 'image/jpeg'
    onAddPicto(mkPhoto(`data:${mime};base64,${b64}`, img.name))
  }

  const subfolders = [...new Set(images.map(i => i.subfolder).filter(Boolean))]

  const filtered = images.filter(img => {
    const matchFolder = !activeFolder || img.subfolder === activeFolder
    const matchQuery  = !query        || img.name.toLowerCase().includes(query.toLowerCase())
    return matchFolder && matchQuery
  })

  if (!isElectron) return (
    <div style={{ padding:'2rem', textAlign:'center', color:T.sub, fontSize:12 }}>
      Galerie locale disponible uniquement dans l'application installée.
    </div>
  )

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'8px 10px', borderBottom:'0.5px solid rgba(0,0,0,0.1)' }}>
        <button onClick={openFolder} style={{
          width:'100%', padding:'10px', borderRadius:10,
          border:`1px solid ${T.mint}`, background:T.mintL,
          color:T.mintD, cursor:'pointer', fontSize:12, fontWeight:500,
        }}>
          📁 {folderPath ? 'Changer de dossier' : 'Choisir un dossier de pictos'}
        </button>
        {folderPath && !loading && (
          <div style={{ fontSize:10, color:T.sub, marginTop:4, textAlign:'center' }}>
            {images.length} image{images.length > 1 ? 's' : ''} • {subfolders.length > 0 ? `${subfolders.length} catégorie${subfolders.length>1?'s':''}` : 'dossier plat'}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div style={{ padding:'6px 10px 4px', borderBottom:'0.5px solid rgba(0,0,0,0.1)' }}>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher…"
            style={{ width:'100%', fontSize:12, padding:'5px 8px', borderRadius:8,
              border:'0.5px solid rgba(0,0,0,0.15)', outline:'none',
              background:T.bg2, color:T.txt, boxSizing:'border-box' }}
          />
        </div>
      )}

      {subfolders.length > 0 && (
        <div style={{ padding:'5px 8px 4px', borderBottom:'0.5px solid rgba(0,0,0,0.1)',
          display:'flex', gap:4, flexWrap:'wrap' }}>
          <button onClick={() => setActiveFolder(null)} style={{
            padding:'2px 7px', borderRadius:20, fontSize:10, cursor:'pointer',
            border:!activeFolder?`1px solid ${T.mint}`:'0.5px solid rgba(0,0,0,0.15)',
            background:!activeFolder?T.mintL:T.bg2,
            color:!activeFolder?T.mintD:T.sub,
          }}>Tous</button>
          {subfolders.map(sf => (
            <button key={sf} onClick={() => setActiveFolder(sf === activeFolder ? null : sf)} style={{
              padding:'2px 7px', borderRadius:20, fontSize:10, cursor:'pointer',
              border:activeFolder===sf?`1px solid ${T.mint}`:'0.5px solid rgba(0,0,0,0.15)',
              background:activeFolder===sf?T.mintL:T.bg2,
              color:activeFolder===sf?T.mintD:T.sub,
            }}>{sf.split('/').pop()}</button>
          ))}
        </div>
      )}

      <div style={{ flex:1, overflow:'auto', padding:8 }}>
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', padding:'2rem', gap:8 }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width:28, height:28, borderRadius:'50%',
              border:`3px solid ${T.mintL}`, borderTop:`3px solid ${T.mint}`,
              animation:'spin 0.8s linear infinite' }} />
            <span style={{ fontSize:11, color:T.sub }}>Lecture du dossier…</span>
          </div>
        )}
        {!loading && !folderPath && (
          <div style={{ textAlign:'center', padding:'2rem', color:T.sub, fontSize:12 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📁</div>
            Choisissez un dossier contenant<br/>vos pictogrammes.
            <div style={{ fontSize:10, marginTop:8, opacity:0.7 }}>
              PNG, JPG, SVG acceptés<br/>Sous-dossiers supportés
            </div>
          </div>
        )}
        {!loading && folderPath && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'2rem', color:T.sub, fontSize:12 }}>Aucun résultat.</div>
        )}
        {!loading && filtered.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
            {filtered.map(img => (
              <button key={img.path} onClick={() => addPicto(img)} title={img.name} style={{
                display:'flex', flexDirection:'column', alignItems:'center',
                gap:3, padding:'7px 3px 5px', borderRadius:9,
                border:'0.5px solid rgba(0,0,0,0.12)',
                background:target?T.bg2:T.bg3,
                cursor:target?'pointer':'not-allowed',
                opacity:target?1:0.45, transition:'background 0.1s',
              }}>
                <img src={localFileUrl(img.path)} alt={img.name}
                  style={{ width:40, height:40, objectFit:'contain' }}
                  onError={e => { e.currentTarget.style.opacity='0.2' }}
                />
                <span style={{ fontSize:8, color:T.sub, textAlign:'center',
                  maxWidth:52, overflow:'hidden', textOverflow:'ellipsis',
                  whiteSpace:'nowrap', width:'100%', lineHeight:1.2 }}>
                  {img.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding:'5px 14px', borderTop:'0.5px solid rgba(0,0,0,0.08)',
        fontSize:9, color:T.sub, textAlign:'center' }}>
        Vos images personnelles
      </div>
    </div>
  )
}

/* ── LibraryPanel ────────────────────────────────────────────────── */
function LibraryPanel({ target, onClose, onAddPicto, T }) {
  const [tab,       setTab]       = useState('arasaac')
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [searched,  setSearched]  = useState(false)
  const [activeCat, setActiveCat] = useState(null)
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

  const searchCat = async cat => {
    setActiveCat(cat.label); setLoading(true); setSearched(true)
    abortRef.current?.abort()
    const seen=[], merged=[]
    for (const term of cat.terms) {
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
    ['arasaac', '🔍 ARASAAC'],
    ['local',   '📁 Galerie locale'],
    ['photo',   '🖼 Photo perso'],
  ]

  return (
    <div style={{ width:296, background:T.bg, borderLeft:'0.5px solid rgba(0,0,0,0.1)',
      display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>

      {/* En-tête */}
      <div style={{ padding:'10px 14px 0', borderBottom:'0.5px solid rgba(0,0,0,0.1)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:T.txt }}>Bibliothèque</div>
            <div style={{ fontSize:10, marginTop:2, color:target?T.mintD:T.sub }}>
              {target ? `→ Ligne ${target.r+1}, Colonne ${target.c+1}` : 'Sélectionnez une cellule (+)'}
            </div>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'transparent',
            cursor:'pointer', color:T.sub, fontSize:20, padding:0, lineHeight:1 }}>×</button>
        </div>
        <div style={{ display:'flex' }}>
          {TABS.map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              flex:1, padding:'8px 2px', border:'none',
              borderBottom:tab===v?`2px solid ${T.mint}`:'2px solid transparent',
              background:'transparent', cursor:'pointer', fontSize:10,
              fontWeight:tab===v?600:400, color:tab===v?T.mintD:T.sub, whiteSpace:'nowrap',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Onglet ARASAAC */}
      {tab === 'arasaac' && <>
        <div style={{ padding:'8px 10px', borderBottom:'0.5px solid rgba(0,0,0,0.1)' }}>
          <div style={{ display:'flex', gap:6 }}>
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setActiveCat(null); doSearch(query) } }}
              placeholder="Chercher en français…"
              style={{ flex:1, fontSize:12, padding:'6px 10px', borderRadius:8,
                border:'0.5px solid rgba(0,0,0,0.15)', outline:'none',
                background:T.bg2, color:T.txt }}
            />
            <button onClick={() => { setActiveCat(null); doSearch(query) }} style={{
              padding:'6px 10px', borderRadius:8, border:`1px solid ${T.mint}`,
              background:T.mintL, color:T.mintD, cursor:'pointer', fontSize:12, fontWeight:500,
            }}>🔍</button>
          </div>
          <div style={{ fontSize:9, color:T.sub, marginTop:4 }}>+14 000 pictogrammes ARASAAC (internet requis)</div>
        </div>
        <div style={{ padding:'6px 10px 4px', borderBottom:'0.5px solid rgba(0,0,0,0.1)',
          display:'flex', gap:4, flexWrap:'wrap' }}>
          {QUICK_CATS.map(cat => (
            <button key={cat.label} onClick={() => searchCat(cat)} style={{
              padding:'3px 8px', borderRadius:20, fontSize:10, cursor:'pointer',
              border:activeCat===cat.label?`1px solid ${T.mint}`:'0.5px solid rgba(0,0,0,0.15)',
              background:activeCat===cat.label?T.mintL:T.bg2,
              color:activeCat===cat.label?T.mintD:T.sub,
              fontWeight:activeCat===cat.label?600:400,
            }}>{cat.label}</button>
          ))}
        </div>
        <div style={{ flex:1, overflow:'auto', padding:8 }}>
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', padding:'2rem', gap:8 }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ width:28, height:28, borderRadius:'50%',
                border:`3px solid ${T.mintL}`, borderTop:`3px solid ${T.mint}`,
                animation:'spin 0.8s linear infinite' }} />
              <span style={{ fontSize:11, color:T.sub }}>Chargement ARASAAC…</span>
            </div>
          )}
          {!loading && searched && results.length === 0 && (
            <div style={{ textAlign:'center', padding:'2rem', color:T.sub, fontSize:12 }}>
              Aucun résultat — essayez un autre mot.
            </div>
          )}
          {!loading && !searched && (
            <div style={{ textAlign:'center', padding:'2rem', color:T.sub, fontSize:12 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
              Tapez un mot ou choisissez une catégorie.
            </div>
          )}
          {!loading && results.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
              {results.map(p => {
                const lbl = p.keywords?.[0]?.keyword || `#${p._id}`
                return (
                  <button key={p._id}
                    onClick={() => target && onAddPicto(mkArasaac(p._id, lbl))}
                    title={lbl}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center',
                      gap:3, padding:'7px 3px 5px', borderRadius:9,
                      border:'0.5px solid rgba(0,0,0,0.12)',
                      background:target?T.bg2:T.bg3,
                      cursor:target?'pointer':'not-allowed',
                      opacity:target?1:0.4, transition:'all 0.12s',
                    }}>
                    <img src={ARASAAC_IMG(p._id)} alt={lbl}
                      style={{ width:40, height:40, objectFit:'contain' }}
                      onError={e => { e.currentTarget.style.opacity='0.2' }}
                    />
                    <span style={{ fontSize:8, color:T.sub, textAlign:'center',
                      maxWidth:52, overflow:'hidden', textOverflow:'ellipsis',
                      whiteSpace:'nowrap', width:'100%', lineHeight:1.2 }}>
                      {lbl}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div style={{ padding:'5px 14px', borderTop:'0.5px solid rgba(0,0,0,0.08)',
          fontSize:9, color:T.sub, textAlign:'center' }}>
          © Sergio Palao / ARASAAC – CC BY-NC-SA 4.0
        </div>
      </>}

      {tab === 'local' && <LocalGalleryTab target={target} onAddPicto={onAddPicto} T={T} />}
      {tab === 'photo' && <PhotoTab target={target} onAddPicto={onAddPicto} T={T} />}
    </div>
  )
}

/* ── Grille initiale ─────────────────────────────────────────────── */
const initGrid = () => {
  const g = Array.from({ length:5 }, () => [null,null,null])
  const c = (e,l,col) => mkEmoji(e,l,col)
  g[0][0]=c('⏰','Réveil','#FAEEDA');       g[0][1]=c('😊','Content','#FBEAF0')
  g[1][0]=c('🚿','Douche','#E6F1FB');        g[1][1]=c('🦷','Dents','#E1F5EE')
  g[2][0]=c('🥣','Petit-déjeuner','#FFF9F0'); g[2][1]=c('🍊','Fruits','#EAF3DE'); g[2][2]=c('💧','Boire','#E3F2FD')
  g[3][0]=c('👕','Habillage','#FBEAF0')
  g[4][0]=c('🎒','Sac école','#F1EFE8');     g[4][1]=c('🚌','Bus','#E1F5EE')
  return g
}

/* ── App principale ──────────────────────────────────────────────── */
export default function App() {
  const [sz1Cm,  setSz1Cm]  = useState(4)
  const [szNCm,  setSzNCm]  = useState(3)
  const [fsCm,   setFsCm]   = useState(0.3)
  const [labels,  setLabels]  = useState(true)
  const [borders, setBorders] = useState(true)
  const [bg,     setBg]     = useState('#FFFFFF')
  const [child,  setChild]  = useState('Lucas')
  const [showLib,setShowLib]= useState(false)
  const [target, setTarget] = useState(null)
  const [clrFor, setClrFor] = useState(null)
  const dragSrc  = useRef(null)
  const [dragOvr,setDragOvr]= useState(null)
  const [grids,  setGrids]  = useState([{ id:'g1', name:'Planning du matin', cells:initGrid() }])
  const [gid,    setGid]    = useState('g1')
  const [rnmGrid,setRnmGrid]= useState(false)
  const [rnmVal, setRnmVal] = useState('')
  const [saveMsg,setSaveMsg]= useState(null)

  const cur = grids.find(g => g.id === gid)
  const nR  = cur?.cells.length || 0
  const nC  = cur?.cells[0]?.length || 0

  const fsPx    = Math.round(fsCm * CM)
  const szPxOf  = c => Math.round((c === 0 ? sz1Cm : szNCm) * CM)
  const cellWOf = c => szPxOf(c) + 20
  const cellHOf = c => szPxOf(c) + (labels ? fsPx*2+14 : 8) + 30
  const maxCellH = cellHOf(0)

  const updG     = (id,fn) => setGrids(p => p.map(g => g.id===id ? fn(g) : g))
  const updCells = fn => updG(gid, g => ({ ...g, cells:fn(g.cells) }))
  const setCell  = (r,c,v) => updCells(cells => cells.map((row,ri) => ri!==r ? row : row.map((cel,ci) => ci!==c ? cel : v)))
  const setCellP = (r,c,k,v) => setCell(r,c, cur?.cells[r]?.[c] ? { ...cur.cells[r][c],[k]:v } : null)
  const addRow   = () => updCells(cells => [...cells, Array(nC).fill(null)])
  const addCol   = () => updCells(cells => cells.map(row => [...row, null]))
  const delRow   = r => { if (nR > 1) updCells(cells => cells.filter((_,i) => i!==r)) }
  const delCol   = c => { if (nC > 1) updCells(cells => cells.map(row => row.filter((_,i) => i!==c))) }

  const openCell = (r,c) => { setTarget({r,c}); setClrFor(null); setShowLib(true) }
  const addPicto = cell  => { if (target) setCell(target.r, target.c, cell) }

  /* Drag & drop desktop */
  const onDragStart = (e,r,c) => { dragSrc.current={r,c}; e.dataTransfer.effectAllowed='copy' }
  const onDragOver  = (e,r,c) => { e.preventDefault(); e.dataTransfer.dropEffect='copy'; setDragOvr({r,c}) }
  const onDragLeave = () => setDragOvr(null)
  const onDrop      = (e,r,c) => {
    e.preventDefault(); setDragOvr(null)
    const src = dragSrc.current; if (!src) return; dragSrc.current = null
    const s = cur?.cells[src.r]?.[src.c]
    if (s && !(src.r===r && src.c===c)) setCell(r, c, { ...s, uid:nid() })
  }
  const onDragEnd = () => { dragSrc.current=null; setDragOvr(null) }

  const addGrid = () => {
    const id = 'g'+nid()
    setGrids(p => [...p, { id, name:'Nouveau planning', cells:[[null,null],[null,null]] }])
    setGid(id)
  }
  const delGrid = id => {
    if (grids.length === 1) return
    setGrids(p => p.filter(g => g.id!==id))
    if (gid === id) setGid(grids.find(g => g.id!==id)?.id)
  }

  /* ── Sauvegarde JSON ──────────────────────────────────────────── */
  const saveJSON = async () => {
    if (!isElectron) return
    const ok = await window.electronAPI.saveJSON({ child, grids })
    setSaveMsg(ok ? '✓ Sauvegardé' : '✗ Erreur')
    setTimeout(() => setSaveMsg(null), 2500)
  }

  const loadJSON = async () => {
    if (!isElectron) return
    const data = await window.electronAPI.openJSON()
    if (!data) return
    if (data.child) setChild(data.child)
    if (data.grids && Array.isArray(data.grids)) {
      setGrids(data.grids)
      setGid(data.grids[0]?.id || 'g1')
    }
  }

  /* ── Impression ───────────────────────────────────────────────── */
  const printPlanning = () => {
    const usedCols = Array.from({ length:nC }, (_,c) =>
      cur?.cells.some(row => row[c]) ? c : -1
    ).filter(c => c >= 0)

    const cellHTML = cur?.cells.flatMap((row,r) => usedCols.map(c => {
      const cell = row[c]
      const sz   = c === 0 ? sz1Cm : szNCm
      const boxStyle = `width:${sz}cm;height:${sz}cm`
      if (!cell) return `<div class="cell"><div class="box" style="${boxStyle};border:none"></div></div>`
      const img = cell.arasaacId
        ? `<img src="${ARASAAC_IMG(cell.arasaacId)}" style="width:${sz*0.86}cm;height:${sz*0.86}cm;object-fit:contain"/>`
        : cell.imageData
        ? `<img src="${cell.imageData}" style="width:${sz*0.86}cm;height:${sz*0.86}cm;object-fit:cover;border-radius:0.12cm"/>`
        : `<span style="font-size:${sz*0.5}cm">${cell.emoji||''}</span>`
      return `<div class="cell">
        <div class="box" style="${boxStyle};background:${cell.color}">${img}</div>
        ${labels ? `<div class="lbl" style="max-width:${sz}cm">${cell.label||''}</div>` : ''}
      </div>`
    })).join('\n')

    const html = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8"/>
<style>
  body { font-family:-apple-system,sans-serif; padding:1cm; background:${bg}; margin:0; }
  h2   { font-size:18px; margin-bottom:4px; }
  .sub { font-size:10px; color:#aaa; margin-bottom:14px; }
  .grid{ display:grid; grid-template-columns:${usedCols.map(c=>c===0?sz1Cm:szNCm).map(s=>s+'cm').join(' ')}; gap:0.3cm; }
  .cell{ display:flex; flex-direction:column; align-items:center; gap:0.1cm; }
  .box { border-radius:0.2cm; display:flex; align-items:center; justify-content:center; overflow:hidden;
         border:${borders?'1.5px solid rgba(0,0,0,0.1)':'none'}; }
  .lbl { font-size:${fsCm}cm; font-weight:500; text-align:center; line-height:1.3; }
  .footer{ margin-top:0.8cm; font-size:8px; color:#bbb; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head><body>
<h2>Planning de ${child||'…'}</h2>
<div class="sub">PictoPlanning By Cedmad · ${cur?.name}</div>
<div class="grid">${cellHTML}</div>
<div class="footer">© Sergio Palao / ARASAAC – CC BY-NC-SA 4.0</div>
</body></html>`

    const w = window.open('', '_blank')
    if (!w) { alert('Autorisez les popups pour imprimer.'); return }
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 300)
  }

  const T = {
    bg:'#ffffff', bg2:'#f5f5f5', bg3:'#eeeeee',
    txt:'#222222', sub:'#888888',
    mint:'#5DCAA5', mintL:'#E1F5EE', mintD:'#085041',
  }

  /* ── Bouton +/− réutilisable ─────────────────────────────────── */
  const Stepper = ({ label, value, unit, onDec, onInc, bold }) => (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span style={{ fontSize:10, color:T.sub, width:38 }}>{label}</span>
      <button onClick={onDec} style={stepBtn}>−</button>
      <span style={{ fontSize:11, fontWeight:bold?600:500, color:bold?T.mintD:'#555',
        background:bold?T.mintL:'#f0f0f0', borderRadius:6, padding:'2px 7px',
        border:`1px solid ${bold?'#9FE1CB':'#ccc'}`, minWidth:40, textAlign:'center' }}>
        {value}{unit}
      </span>
      <button onClick={onInc} style={stepBtn}>+</button>
    </div>
  )
  const stepBtn = { width:24, height:24, borderRadius:6, border:'1px solid rgba(0,0,0,0.18)',
    background:'#f0f0f0', cursor:'pointer', fontSize:15, fontWeight:700, color:'#444',
    display:'flex', alignItems:'center', justifyContent:'center', padding:0, flexShrink:0 }

  return (
    <div style={{ fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'#F8F7F3' }}>

      {/* ── BARRE D'OUTILS ─────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'0.5px solid rgba(0,0,0,0.1)',
        padding:'8px 14px', display:'flex', alignItems:'center', gap:10,
        flexShrink:0, flexWrap:'wrap' }}>

        {/* Logo */}
        <div style={{ display:'flex', flexDirection:'column', lineHeight:1.2, flexShrink:0 }}>
          <span style={{ fontSize:15, fontWeight:700, letterSpacing:-0.3 }}>
            <span style={{ color:'#2B7BE9' }}>Picto</span>
            <span style={{ color:'#E84545' }}>Planning</span>
          </span>
          <span style={{ fontSize:9, color:'#2B7BE9', fontWeight:600 }}>By Cedmad</span>
        </div>

        <div style={{ width:'0.5px', height:26, background:'rgba(0,0,0,0.1)', flexShrink:0 }} />

        {/* Prénom */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, color:T.sub }}>Enfant</span>
          <input value={child} onChange={e => setChild(e.target.value)}
            placeholder="Prénom…"
            style={{ fontSize:12, fontWeight:500, border:'1px solid rgba(0,0,0,0.15)',
              borderRadius:8, padding:'4px 10px', background:'#f5f5f5', outline:'none', width:110 }} />
        </div>

        <div style={{ width:'0.5px', height:26, background:'rgba(0,0,0,0.1)', flexShrink:0 }} />

        {/* Tailles */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <Stepper label="Col 1" value={sz1Cm} unit="cm" bold
            onDec={() => setSz1Cm(v => +(Math.max(2,v-0.5)).toFixed(1))}
            onInc={() => setSz1Cm(v => +(Math.min(8,+v+0.5)).toFixed(1))} />
          <Stepper label="Autres" value={szNCm} unit="cm"
            onDec={() => setSzNCm(v => +(Math.max(2,v-0.5)).toFixed(1))}
            onInc={() => setSzNCm(v => +(Math.min(8,+v+0.5)).toFixed(1))} />
        </div>

        {/* Police */}
        <Stepper label="Police" value={fsCm} unit="cm"
          onDec={() => setFsCm(v => +(Math.max(0.2,v-0.05)).toFixed(2))}
          onInc={() => setFsCm(v => +(Math.min(0.6,+v+0.05)).toFixed(2))} />

        {/* Bascules */}
        {[[labels,setLabels,'🏷 Étiquettes'],[borders,setBorders,'⬜ Bordures']].map(([v,s,l]) => (
          <button key={l} onClick={() => s(x => !x)} style={{
            padding:'4px 10px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.15)',
            background:v?T.mintL:'#f5f5f5', color:v?T.mintD:T.sub,
            cursor:'pointer', fontSize:11, fontWeight:v?600:400 }}>
            {l}
          </button>
        ))}

        {/* Couleur de fond */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:11, color:T.sub }}>Fond</span>
          {['#FFFFFF','#F8F6F0','#E1F5EE','#E6F1FB','#FAEEDA','#FBEAF0'].map(c => (
            <button key={c} onClick={() => setBg(c)} style={{
              width:16, height:16, borderRadius:4, background:c, cursor:'pointer', padding:0,
              border:bg===c?`2.5px solid ${T.mint}`:'0.5px solid rgba(0,0,0,0.15)',
            }} />
          ))}
        </div>

        {/* Actions droite */}
        <div style={{ marginLeft:'auto', display:'flex', gap:6, flexShrink:0, alignItems:'center' }}>
          {isElectron && <>
            <button onClick={loadJSON} style={actionBtn('#f5f5f5', T.sub)}>📂 Ouvrir</button>
            <button onClick={saveJSON} style={actionBtn(T.mintL, T.mintD)}>
              💾 Enregistrer
            </button>
            {saveMsg && <span style={{ fontSize:11, color:T.mintD, fontWeight:600 }}>{saveMsg}</span>}
          </>}
          <button onClick={() => setShowLib(l => !l)} style={{
            ...actionBtn(showLib?T.mintL:'#fff', showLib?T.mintD:T.txt),
            border:showLib?`1px solid ${T.mint}`:'0.5px solid rgba(0,0,0,0.15)',
          }}>🧩 Bibliothèque</button>
          <button onClick={printPlanning} style={actionBtn('#fff', T.txt)}>🖨 Imprimer</button>
        </div>
      </div>

      {/* ── ONGLETS PLANNINGS ──────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'0.5px solid rgba(0,0,0,0.1)',
        padding:'0 14px', display:'flex', alignItems:'stretch', overflowX:'auto', flexShrink:0 }}>
        {grids.map(g => (
          <div key={g.id} style={{ display:'flex', alignItems:'center' }}>
            {rnmGrid && gid === g.id
              ? <input autoFocus value={rnmVal}
                  onChange={e => setRnmVal(e.target.value)}
                  onBlur={() => { updG(g.id, gg => ({ ...gg, name:rnmVal||gg.name })); setRnmGrid(false) }}
                  onKeyDown={e => { if (e.key==='Enter') { updG(g.id, gg => ({ ...gg, name:rnmVal||gg.name })); setRnmGrid(false) } }}
                  style={{ fontSize:12, fontWeight:500, border:'none',
                    borderBottom:`2px solid ${T.mint}`, outline:'none',
                    padding:'10px 4px', background:'transparent', minWidth:90 }}
                />
              : <button
                  onClick={() => setGid(g.id)}
                  onDoubleClick={() => { setRnmGrid(true); setRnmVal(g.name); setGid(g.id) }}
                  style={{ padding:'10px 14px', fontSize:12, fontWeight:gid===g.id?600:400,
                    border:'none', borderBottom:gid===g.id?`2px solid ${T.mint}`:'2px solid transparent',
                    background:'transparent', cursor:'pointer',
                    color:gid===g.id?T.mintD:T.sub, whiteSpace:'nowrap' }}>
                  {g.name}
                </button>
            }
            {grids.length > 1 && (
              <button onClick={() => delGrid(g.id)} style={{ border:'none', background:'transparent',
                cursor:'pointer', color:T.sub, fontSize:13, padding:'0 2px 0 0' }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addGrid} style={{ padding:'10px 12px', fontSize:12, border:'none',
          background:'transparent', cursor:'pointer', color:T.mint, fontWeight:500 }}>
          + Nouveau planning
        </button>
      </div>

      {/* ── CORPS ─────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ flex:1, overflow:'auto', padding:'1.2rem 1.5rem' }}>

          {/* Info ligne */}
          <div style={{ marginBottom:12, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:500 }}>
              Planning de <b>{child||'…'}</b> — {cur?.name}
            </span>
            <button onClick={() => { setRnmGrid(true); setRnmVal(cur?.name||'') }} style={{
              fontSize:11, color:T.sub, border:'0.5px solid rgba(0,0,0,0.15)',
              background:'#f5f5f5', borderRadius:4, padding:'2px 7px', cursor:'pointer' }}>
              ✏ Renommer
            </button>
            <span style={{ fontSize:11, color:T.sub }}>{nR} ligne{nR>1?'s':''} × {nC} col{nC>1?'s':''}</span>
            {target && (
              <span style={{ fontSize:11, color:T.mintD, background:T.mintL,
                padding:'2px 10px', borderRadius:12, border:`1px solid ${T.mint}` }}>
                📍 Ligne {target.r+1}, Col {target.c+1}
              </span>
            )}
            <span style={{ fontSize:11, color:'#633806', background:'#FAEEDA',
              padding:'2px 8px', borderRadius:10, border:'1px solid #FAC775', marginLeft:'auto' }}>
              ✋ Maintenir → glisser
            </span>
          </div>

          {/* Contrôles lignes/colonnes + grille */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:6 }}>

            {/* Boutons × lignes */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, paddingTop:32, flexShrink:0 }}>
              {cur?.cells.map((_,r) => (
                <div key={r} style={{ height:maxCellH, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <button onClick={() => delRow(r)} disabled={nR<=1} style={delBtn(nR<=1)}>×</button>
                </div>
              ))}
            </div>

            <div>
              {/* En-tête colonnes */}
              <div style={{ display:'flex', gap:8, marginBottom:4 }}>
                {cur?.cells[0]?.map((_,c) => (
                  <div key={c} style={{ width:cellWOf(c), display:'flex', flexDirection:'column',
                    alignItems:'center', gap:2 }}>
                    <span style={{ fontSize:9, color:T.sub }}>Col {c+1}</span>
                    <button onClick={() => delCol(c)} disabled={nC<=1} style={delBtn(nC<=1)}>×</button>
                  </div>
                ))}
                <button onClick={addCol} style={{ width:24, alignSelf:'flex-end', padding:'4px 3px',
                  borderRadius:7, border:'0.5px solid rgba(0,0,0,0.15)', background:'#f5f5f5',
                  color:T.sub, cursor:'pointer', fontSize:14, fontWeight:600,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
              </div>

              {/* Grille */}
              <div style={{
                display:'inline-grid',
                gridTemplateColumns:Array.from({length:nC},(_,c) => cellWOf(c)+'px').join(' '),
                gap:8, background:bg, borderRadius:14,
                border:'0.5px solid rgba(0,0,0,0.1)', padding:14,
              }}>
                {cur?.cells.flatMap((row,r) => row.map((cell,c) => {
                  const isTgt = target?.r===r && target?.c===c
                  const isOvr = dragOvr?.r===r && dragOvr?.c===c
                  const isClr = clrFor?.r===r && clrFor?.c===c
                  return (
                    <div key={`${r}_${c}`}
                      data-cell={`${r},${c}`}
                      style={{ width:cellWOf(c), minHeight:cellHOf(c), display:'flex',
                        flexDirection:'column', alignItems:'center', gap:4, position:'relative' }}
                      onDragOver={e => onDragOver(e,r,c)}
                      onDragLeave={onDragLeave}
                      onDrop={e => onDrop(e,r,c)}>

                      {cell ? (<>
                        <div draggable
                          onDragStart={e => onDragStart(e,r,c)}
                          onDragEnd={onDragEnd}
                          onClick={() => openCell(r,c)}
                          style={{
                            width:szPxOf(c), height:szPxOf(c), background:isOvr?T.mintL:cell.color,
                            borderRadius:11, border:isOvr||isTgt?`2.5px solid ${T.mint}`:borders?'1px solid rgba(0,0,0,0.09)':'none',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            cursor:'grab', position:'relative', userSelect:'none', overflow:'hidden',
                          }}>
                          <PictoCell cell={cell} sz={szPxOf(c)} />
                          {isOvr && (
                            <div style={{ position:'absolute', inset:0, borderRadius:10,
                              background:'rgba(93,202,165,0.18)', display:'flex',
                              alignItems:'center', justifyContent:'center',
                              fontSize:szPxOf(c)*0.3, pointerEvents:'none' }}>📋</div>
                          )}
                        </div>
                        <button onClick={e => { e.stopPropagation(); setCell(r,c,null) }} style={{
                          position:'absolute', top:-7, right:-7, width:22, height:22,
                          borderRadius:'50%', background:'#FAECE7', border:'1.5px solid #F0997B',
                          cursor:'pointer', fontSize:13, color:'#993C1D',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontWeight:700, padding:0, zIndex:20 }}>×</button>
                        {labels && (
                          <span onClick={() => {
                            const v = window.prompt('Nom :', cell.label||'')
                            if (v !== null) setCellP(r,c,'label',v)
                          }} style={{ fontSize:fsPx, fontWeight:500, textAlign:'center',
                            maxWidth:cellWOf(c)-4, cursor:'text', lineHeight:1.3,
                            display:'block', padding:'1px 2px', userSelect:'none' }}>
                            {cell.label}
                          </span>
                        )}
                        <button onClick={e => { e.stopPropagation(); setClrFor(isClr?null:{r,c}) }}
                          style={{ width:20, height:20, borderRadius:5, background:cell.color,
                            border:isClr?`1.5px solid ${T.mint}`:'0.5px solid rgba(0,0,0,0.15)',
                            cursor:'pointer', display:'flex', alignItems:'center',
                            justifyContent:'center', padding:0, fontSize:9 }}
                          title="Couleur de fond">🎨</button>
                        {isClr && (
                          <div style={{ position:'absolute', top:'100%', left:'50%',
                            transform:'translateX(-50%)', marginTop:4, background:'#fff',
                            border:'0.5px solid rgba(0,0,0,0.15)', borderRadius:10, padding:8,
                            zIndex:300, display:'grid', gridTemplateColumns:'repeat(4,1fr)',
                            gap:5, boxShadow:'0 4px 18px rgba(0,0,0,0.1)', width:118 }}>
                            {PALETTE.map((p,i) => (
                              <button key={p} onClick={() => { setCellP(r,c,'color',p); setClrFor(null) }}
                                title={PAL_NAMES[i]}
                                style={{ width:22, height:22, borderRadius:5, background:p,
                                  border:cell.color===p?`2px solid ${T.mint}`:'0.5px solid rgba(0,0,0,0.15)',
                                  cursor:'pointer', padding:0 }} />
                            ))}
                          </div>
                        )}
                      </>) : (
                        <div onClick={() => openCell(r,c)} style={{
                          width:szPxOf(c), height:szPxOf(c), borderRadius:11,
                          border:isOvr?`2.5px solid ${T.mint}`:isTgt?`2px dashed ${T.mint}`:'1.5px dashed rgba(0,0,0,0.2)',
                          background:isOvr?T.mintL:isTgt?'#f0faf6':'transparent',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:isOvr?szPxOf(c)*0.38:22,
                          color:isOvr?T.mint:isTgt?T.mint:'#bbb',
                          cursor:'pointer', transition:'all 0.12s',
                        }}>
                          {isOvr ? '📋' : '+'}
                        </div>
                      )}
                    </div>
                  )
                }))}
              </div>

              <button onClick={addRow} style={{ marginTop:10, padding:'6px 16px', borderRadius:8,
                border:'0.5px solid rgba(0,0,0,0.15)', background:'#f5f5f5', color:T.sub,
                cursor:'pointer', fontSize:12, fontWeight:500,
                display:'flex', alignItems:'center', gap:5, width:'fit-content' }}>
                + Ajouter une ligne
              </button>
            </div>
          </div>
        </div>

        {showLib && (
          <LibraryPanel target={target} onClose={() => setShowLib(false)} onAddPicto={addPicto} T={T} />
        )}
      </div>
    </div>
  )
}

/* Styles partagés */
const actionBtn = (bg, color) => ({
  padding:'5px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.15)',
  background:bg, color, cursor:'pointer', fontSize:12, fontWeight:500,
})
const delBtn = disabled => ({
  width:17, height:17, borderRadius:'50%', fontSize:11, fontWeight:700, padding:0,
  border:disabled?'0.5px solid rgba(0,0,0,0.1)':'1px solid #F0997B',
  background:disabled?'#eee':'#FAECE7',
  color:disabled?'#bbb':'#993C1D',
  cursor:disabled?'default':'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
})
