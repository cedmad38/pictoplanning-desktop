import { useRef } from 'react'

export function PrintPreview({ html, onClose, onPrint }) {
  const iframeRef = useRef(null)

  /* Ajuste la hauteur de l'iframe au contenu réel */
  const onLoad = () => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.body) return
    const h = iframe.contentDocument.body.scrollHeight
    iframe.style.height = Math.max(h + 40, 400) + 'px'
  }

  return (
    /* Overlay — clic hors de la carte = fermer */
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position:'fixed', inset:0, zIndex:2000,
        background:'rgba(15,20,30,.6)',
        display:'flex', alignItems:'center', justifyContent:'center',
        animation:'fadeIn .18s ease',
      }}
    >
      <div style={{
        width:'min(860px, 90vw)', maxHeight:'92vh',
        background:'#fff', borderRadius:16,
        display:'flex', flexDirection:'column',
        boxShadow:'0 28px 72px rgba(0,0,0,.4)',
        overflow:'hidden',
        animation:'popIn .18s ease',
      }}>

        {/* ── En-tête ───────────────────────────────────────────── */}
        <div style={{
          display:'flex', alignItems:'center',
          justifyContent:'space-between',
          padding:'14px 20px',
          borderBottom:'1px solid rgba(0,0,0,.08)',
          background:'#F5F6F9', flexShrink:0,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>🖨</span>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#1A1D23' }}>
                Aperçu avant impression
              </div>
              <div style={{ fontSize:10, color:'#64748B', marginTop:1 }}>
                Vérifiez le résultat, puis cliquez « Imprimer »
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={btnSecondary}>✕ Fermer</button>
            <button onClick={onPrint} style={btnPrimary}>🖨 Imprimer</button>
          </div>
        </div>

        {/* ── Zone de prévisualisation (fond gris = hors page) ─── */}
        <div style={{
          flex:1, overflow:'auto',
          background:'#64748B',
          padding:'24px 20px',
        }}>
          {/* Feuille blanche centrée */}
          <div style={{
            maxWidth:800, margin:'0 auto',
            background:'#fff',
            borderRadius:3,
            boxShadow:'0 4px 20px rgba(0,0,0,.25)',
            overflow:'hidden',
          }}>
            <iframe
              ref={iframeRef}
              srcDoc={html}
              onLoad={onLoad}
              style={{
                width:'100%',
                minHeight:400,
                height:'auto',
                border:'none',
                display:'block',
              }}
              title="Aperçu avant impression"
            />
          </div>
        </div>

        {/* ── Pied — rappel raccourci ───────────────────────────── */}
        <div style={{
          padding:'8px 20px',
          borderTop:'1px solid rgba(0,0,0,.07)',
          background:'#F5F6F9',
          fontSize:10, color:'#94A3B8', textAlign:'center', flexShrink:0,
        }}>
          Raccourci : Ctrl+P · Cliquer hors de la carte pour fermer
        </div>
      </div>
    </div>
  )
}

/* ── Styles boutons ──────────────────────────────────────────────── */
const btnSecondary = {
  padding:'8px 16px', borderRadius:8,
  border:'1px solid rgba(0,0,0,.12)', background:'#fff',
  color:'#64748B', fontSize:12, fontWeight:500, cursor:'pointer',
}
const btnPrimary = {
  padding:'8px 20px', borderRadius:8,
  border:'1px solid #9FE1CB', background:'#E1F5EE',
  color:'#085041', fontSize:13, fontWeight:700, cursor:'pointer',
}
