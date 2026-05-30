export function Toolbar({
  child, setChild,
  canUndo, canRedo, onUndo, onRedo,
  showLib, onToggleLib,
  showSettings, onToggleSettings,
  isElectron, onSave, onLoad, onPrint,
}) {
  return (
    <header style={{
      background:'#fff',
      borderBottom:'1px solid rgba(0,0,0,.07)',
      padding:'0 16px',
      height:52,
      display:'flex', alignItems:'center', gap:10,
      flexShrink:0,
      userSelect:'none',
    }}>
      {/* Logo */}
      <div style={{ display:'flex', flexDirection:'column', flexShrink:0, lineHeight:1 }}>
        <div style={{ display:'flex', alignItems:'baseline' }}>
          <span style={{ fontSize:18, fontWeight:800, letterSpacing:-.5, color:'#2B7BE9' }}>Picto</span>
          <span style={{ fontSize:18, fontWeight:800, letterSpacing:-.5, color:'#E84545' }}>Planning</span>
        </div>
        <span style={{ fontSize:9, fontWeight:600, color:'#2B7BE9', letterSpacing:.3, marginTop:1 }}>By Cedmad</span>
      </div>

      <Divider />

      {/* Enfant */}
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:11, color:'#64748B', flexShrink:0 }}>Enfant :</span>
        <input
          value={child}
          onChange={e => setChild(e.target.value)}
          placeholder="Prénom…"
          style={{
            fontSize:13, fontWeight:500,
            border:'1.5px solid rgba(0,0,0,.12)',
            borderRadius:8, padding:'4px 10px',
            background:'#F5F6F9', outline:'none',
            width:115, color:'#1A1D23',
            transition:'border-color .15s',
          }}
          onFocus={e => e.target.style.borderColor = '#5DCAA5'}
          onBlur={e  => e.target.style.borderColor = 'rgba(0,0,0,.12)'}
        />
      </div>

      <Divider />

      {/* Annuler / Rétablir */}
      <div style={{ display:'flex', gap:3 }}>
        <IconBtn onClick={onUndo} disabled={!canUndo} title="Annuler (Ctrl+Z)">⟲</IconBtn>
        <IconBtn onClick={onRedo} disabled={!canRedo} title="Rétablir (Ctrl+Y)">⟳</IconBtn>
      </div>

      {/* Spacer */}
      <div style={{ flex:1 }} />

      {/* Actions droite */}
      <TbBtn
        onClick={onToggleSettings}
        active={showSettings}
        title="Réglages d'affichage"
      >
        ⚙ Réglages
      </TbBtn>

      <Divider />

      <TbBtn
        onClick={onToggleLib}
        active={showLib}
        title="Bibliothèque de pictogrammes (B)"
      >
        🧩 Bibliothèque
      </TbBtn>

      {isElectron && <>
        <TbBtn onClick={onLoad} title="Ouvrir un fichier (Ctrl+O)">
          📂 Ouvrir
        </TbBtn>
        <TbBtn
          onClick={onSave}
          accent
          title="Enregistrer (Ctrl+S)"
        >
          💾 Enregistrer
        </TbBtn>
      </>}

      <TbBtn onClick={onPrint} title="Imprimer (Ctrl+P)">
        🖨 Imprimer
      </TbBtn>
    </header>
  )
}

/* ── Sous-composants ─────────────────────────────────────────────── */

function Divider() {
  return <div style={{ width:1, height:22, background:'rgba(0,0,0,.08)', flexShrink:0 }} />
}

function IconBtn({ onClick, disabled, title, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="tb-btn"
      style={{
        width:28, height:28, borderRadius:7,
        border:'1px solid rgba(0,0,0,.09)',
        background:'#F5F6F9',
        color: disabled ? '#CBD5E1' : '#1A1D23',
        fontSize:14, padding:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >{children}</button>
  )
}

function TbBtn({ onClick, title, children, active, accent }) {
  const bg    = active  ? '#E1F5EE' : accent ? '#E1F5EE' : '#F5F6F9'
  const color = active  ? '#085041' : accent ? '#085041' : '#1A1D23'
  const bord  = active  ? '1px solid #9FE1CB' : accent ? '1px solid #9FE1CB' : '1px solid rgba(0,0,0,.09)'
  return (
    <button
      onClick={onClick}
      title={title}
      className="tb-btn"
      style={{
        padding:'5px 12px', borderRadius:8,
        border:bord, background:bg, color,
        fontSize:12, fontWeight: active||accent ? 600 : 500,
        whiteSpace:'nowrap', cursor:'pointer',
      }}
    >{children}</button>
  )
}
