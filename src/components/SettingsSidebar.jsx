import { PALETTE, PAL_NAMES } from '../constants'

export function SettingsSidebar({
  sz1Cm, setSz1Cm, szNCm, setSzNCm,
  fsCm, setFsCm,
  labels, setLabels, borders, setBorders,
  bg, setBg,
  onClose,
}) {
  return (
    <aside className="slide-left" style={{
      width:234, background:'#fff',
      borderRight:'1px solid rgba(0,0,0,.07)',
      display:'flex', flexDirection:'column',
      flexShrink:0, overflow:'hidden',
    }}>
      {/* En-tête */}
      <div style={{
        padding:'14px 16px 10px',
        borderBottom:'1px solid rgba(0,0,0,.06)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#1A1D23' }}>⚙ Réglages</span>
        <button onClick={onClose} style={{
          border:'none', background:'transparent',
          cursor:'pointer', color:'#94A3B8', fontSize:18,
          lineHeight:1, padding:0,
          transition:'color .12s',
        }}
          onMouseEnter={e => e.target.style.color = '#1A1D23'}
          onMouseLeave={e => e.target.style.color = '#94A3B8'}
        >×</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:18 }}>
        {/* Tailles */}
        <Section title="📐 Tailles des cellules">
          <Stepper
            label="1re colonne" value={sz1Cm} unit="cm"
            onDec={() => setSz1Cm(v => +(Math.max(2, v-.5)).toFixed(1))}
            onInc={() => setSz1Cm(v => +(Math.min(8, +v+.5)).toFixed(1))}
          />
          <Stepper
            label="Autres cols" value={szNCm} unit="cm"
            onDec={() => setSzNCm(v => +(Math.max(2, v-.5)).toFixed(1))}
            onInc={() => setSzNCm(v => +(Math.min(8, +v+.5)).toFixed(1))}
          />
          <Stepper
            label="Taille texte" value={fsCm} unit="cm"
            onDec={() => setFsCm(v => +(Math.max(.2, v-.05)).toFixed(2))}
            onInc={() => setFsCm(v => +(Math.min(.6, +v+.05)).toFixed(2))}
          />
        </Section>

        {/* Affichage */}
        <Section title="👁 Affichage">
          <Toggle value={labels}  onChange={setLabels}  label="Étiquettes" />
          <Toggle value={borders} onChange={setBorders} label="Bordures" />
        </Section>

        {/* Couleur de fond */}
        <Section title="🎨 Fond de grille">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:5, paddingTop:2 }}>
            {PALETTE.map((p, i) => (
              <button
                key={p}
                onClick={() => setBg(p)}
                title={PAL_NAMES[i]}
                style={{
                  width:'100%', aspectRatio:'1', borderRadius:6, background:p,
                  border: bg===p ? '2.5px solid #5DCAA5' : '1px solid rgba(0,0,0,.13)',
                  cursor:'pointer', padding:0,
                  boxShadow: bg===p ? '0 0 0 1px #5DCAA5' : 'none',
                  transition:'box-shadow .12s',
                }}
              />
            ))}
          </div>
          <button
            onClick={() => setBg('#FFFFFF')}
            style={{
              width:'100%', padding:'7px', marginTop:4, borderRadius:8,
              border:'1px solid rgba(0,0,0,.1)', background:'#F5F6F9',
              color:'#64748B', fontSize:11, cursor:'pointer',
              fontWeight: bg==='#FFFFFF' ? 600 : 400,
            }}
          >Blanc pur</button>
        </Section>
      </div>

      <div style={{
        padding:'8px 16px', borderTop:'1px solid rgba(0,0,0,.06)',
        fontSize:10, color:'#94A3B8', textAlign:'center',
      }}>
        Drag = déplacer • Double-clic = renommer onglet
      </div>
    </aside>
  )
}

/* ── Sous-composants ─────────────────────────────────────────────── */

function Section({ title, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ fontSize:11, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:.5 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Stepper({ label, value, unit, onDec, onInc }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <span style={{ fontSize:12, color:'#1A1D23' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <StepBtn onClick={onDec}>−</StepBtn>
        <span style={{
          fontSize:12, fontWeight:700, color:'#085041',
          background:'#E1F5EE', borderRadius:6, padding:'3px 9px',
          minWidth:52, textAlign:'center', border:'1px solid #9FE1CB',
        }}>{value}{unit}</span>
        <StepBtn onClick={onInc}>+</StepBtn>
      </div>
    </div>
  )
}

function StepBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width:26, height:26, borderRadius:6,
      border:'1px solid rgba(0,0,0,.12)', background:'#F5F6F9',
      color:'#1A1D23', fontSize:14, fontWeight:700,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:0, cursor:'pointer',
    }}>{children}</button>
  )
}

function Toggle({ value, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        width:'100%', padding:'9px 12px', borderRadius:9,
        border: value ? '1px solid #9FE1CB' : '1px solid rgba(0,0,0,.09)',
        background: value ? '#E1F5EE' : '#F5F6F9',
        cursor:'pointer', fontSize:12, fontWeight:500,
        color: value ? '#085041' : '#1A1D23',
        transition:'background .15s, border-color .15s',
      }}
    >
      <span>{label}</span>
      {/* Toggle switch */}
      <div style={{
        width:34, height:19, borderRadius:10,
        background: value ? '#5DCAA5' : '#CBD5E1',
        transition:'background .2s',
        position:'relative', flexShrink:0,
      }}>
        <div style={{
          width:15, height:15, borderRadius:'50%',
          background:'#fff',
          position:'absolute', top:2,
          left: value ? 17 : 2,
          transition:'left .2s',
          boxShadow:'0 1px 3px rgba(0,0,0,.2)',
        }} />
      </div>
    </button>
  )
}
