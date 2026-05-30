import { useState, useRef } from 'react'
import { PALETTE } from '../constants'
import { rndC, squareCrop, resizeOnly, mkPhoto } from '../utils'
import { isElectron } from '../constants'

export function PhotoTab({ target, onAddPicto }) {
  const [step,    setStep]   = useState('choose')
  const [proc,    setProc]   = useState(null)
  const [fit,     setFit]    = useState(false)
  const [label,   setLabel]  = useState('')
  const [color,   setColor]  = useState(rndC())
  const fileRef = useRef(null)

  const handle = async dataUrl => {
    const p = fit ? await resizeOnly(dataUrl) : await squareCrop(dataUrl)
    setProc(p); setColor(rndC()); setLabel(''); setStep('preview')
  }

  const openFile = async () => {
    if (isElectron) {
      const r = await window.electronAPI.openImageFile()
      if (r) await handle(r.dataUrl)
    } else {
      fileRef.current?.click()
    }
  }

  const onFilePick = async e => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => { await handle(ev.target.result) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const confirm = () => {
    if (!target || !proc) return
    const cell = mkPhoto(proc, label || 'Photo')
    if (fit) cell.imageMode = 'contain'
    onAddPicto(cell)
    reset()
  }

  const reset = () => { setProc(null); setLabel(''); setStep('choose') }

  if (step === 'choose') return (
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:16, padding:'1.5rem 1rem',
    }}>
      {!target && (
        <div style={{
          fontSize:11, color:'#64748B', textAlign:'center',
          background:'#FEF3C7', padding:'8px 14px', borderRadius:8,
          border:'1px solid #FDE68A',
        }}>
          Sélectionnez d'abord une cellule (+)
        </div>
      )}

      {/* Mode recadrage */}
      <div style={{ width:210 }}>
        <div style={{ fontSize:11, color:'#64748B', marginBottom:6, textAlign:'center' }}>Format</div>
        <div style={{ display:'flex', borderRadius:9, overflow:'hidden', border:'1px solid rgba(0,0,0,.1)' }}>
          <ModeBtn active={!fit} onClick={() => setFit(false)}>⬛ Recadrer</ModeBtn>
          <ModeBtn active={fit}  onClick={() => setFit(true)}>🖼 Plein cadre</ModeBtn>
        </div>
        <div style={{ fontSize:9, color:'#94A3B8', textAlign:'center', marginTop:4 }}>
          {fit ? 'Image entière sans rognage' : 'Image rognée en carré'}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={onFilePick} style={{ display:'none' }} />

      <button onClick={openFile} disabled={!target} style={{
        width:210, padding:'16px 0', borderRadius:14,
        cursor: target ? 'pointer' : 'not-allowed',
        border: `1.5px solid ${target ? '#5DCAA5' : '#E2E8F0'}`,
        background: target ? '#E1F5EE' : '#F5F6F9',
        color: target ? '#085041' : '#94A3B8',
        display:'flex', flexDirection:'column', alignItems:'center', gap:8,
        transition:'background .12s, border-color .12s',
      }}>
        <span style={{ fontSize:34 }}>🖼</span>
        <span style={{ fontSize:13, fontWeight:600 }}>Choisir une image</span>
        <span style={{ fontSize:10, opacity:.7 }}>Depuis votre ordinateur</span>
      </button>
    </div>
  )

  if (step === 'preview') return (
    <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12, padding:'.9rem' }}>
      <div style={{ display:'flex', justifyContent:'center' }}>
        <div style={{
          width:130, height:130, borderRadius:14, overflow:'hidden',
          border:`2px solid ${fit ? '#2B7BE9' : '#5DCAA5'}`,
          background:color,
        }}>
          {proc && <img src={proc} alt="Aperçu"
            style={{ width:'100%', height:'100%', objectFit:fit?'contain':'cover' }} />}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        <span style={{ fontSize:12, fontWeight:500 }}>Nom du pictogramme</span>
        <input
          type="text" value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && confirm()}
          placeholder="Ex : Piscine, Mamie…"
          style={{
            fontSize:14, padding:'9px 12px', borderRadius:9,
            border:'1.5px solid #5DCAA5', outline:'none',
            width:'100%', boxSizing:'border-box',
          }}
        />
      </div>

      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
        <span style={{ fontSize:11, color:'#64748B' }}>Couleur de fond</span>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'center' }}>
          {PALETTE.map(p => (
            <button key={p} onClick={() => setColor(p)} style={{
              width:22, height:22, borderRadius:6, background:p, padding:0,
              border: color===p ? '2px solid #5DCAA5' : '.5px solid rgba(0,0,0,.13)',
              cursor:'pointer',
            }} />
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:8, paddingBottom:10 }}>
        <button onClick={reset} style={{
          flex:1, padding:'10px 0', borderRadius:9,
          border:'1px solid rgba(0,0,0,.1)', background:'#F5F6F9',
          cursor:'pointer', fontSize:12, color:'#64748B',
        }}>↩ Recommencer</button>
        <button onClick={confirm} disabled={!target} style={{
          flex:2, padding:'10px 0', borderRadius:9, border:'none',
          background: target ? '#E1F5EE' : '#F0F0F0',
          color: target ? '#085041' : '#94A3B8',
          cursor: target ? 'pointer' : 'not-allowed',
          fontSize:13, fontWeight:600,
        }}>✓ Ajouter à la grille</button>
      </div>
    </div>
  )

  return null
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:'7px 0', border:'none',
      fontSize:11, fontWeight: active ? 600 : 400,
      background: active ? '#E1F5EE' : '#F5F6F9',
      color: active ? '#085041' : '#94A3B8',
      cursor:'pointer', transition:'background .12s',
    }}>{children}</button>
  )
}
