import { PALETTE, PAL_NAMES, ARASAAC_IMG } from '../constants'
import { nid } from '../utils'

/* ── Rendu du pictogramme dans une cellule ───────────────────────── */
function PictoCell({ cell, sz }) {
  const s = { width:sz*.86, height:sz*.86, objectFit:'contain', display:'block', pointerEvents:'none' }
  if (cell.imageData) {
    const fit = cell.imageMode === 'contain'
    return <img src={cell.imageData} alt={cell.label} draggable={false}
      style={{ ...s, objectFit:fit?'contain':'cover', borderRadius:fit?4:6 }} />
  }
  if (cell.arasaacId) return (
    <img src={ARASAAC_IMG(cell.arasaacId)} alt={cell.label} draggable={false}
      style={s} onError={e => { e.currentTarget.style.opacity='.3' }} />
  )
  return <span style={{ fontSize:sz*.48, lineHeight:1, pointerEvents:'none' }}>{cell.emoji}</span>
}

/* ── Sélecteur de couleur ─────────────────────────────────────────── */
function ColorPicker({ cell, onSelect }) {
  return (
    <div style={{
      position:'absolute', top:'105%', left:'50%',
      transform:'translateX(-50%)',
      background:'#fff',
      border:'1px solid rgba(0,0,0,.12)',
      borderRadius:12, padding:10, zIndex:400,
      display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5,
      boxShadow:'0 6px 24px rgba(0,0,0,.12)',
      width:122,
      animation:'popIn .14s ease',
    }}>
      {PALETTE.map((p, i) => (
        <button key={p} onClick={() => onSelect(p)} title={PAL_NAMES[i]}
          style={{
            width:22, height:22, borderRadius:5, background:p, padding:0,
            border: cell.color===p ? '2px solid #5DCAA5' : '.5px solid rgba(0,0,0,.13)',
            cursor:'pointer',
            boxShadow: cell.color===p ? '0 0 0 1px #5DCAA5' : 'none',
          }}
        />
      ))}
    </div>
  )
}

/* ── GridArea ─────────────────────────────────────────────────────── */
export function GridArea({
  cur, gid, nR, nC,
  sz1Cm, szNCm, fsCm, labels, borders, bg,
  target, setTarget,
  clrFor, setClrFor,
  dragOvr,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  openCell, setCell, setCellP,
  addRow, addCol, delRow, delCol,
  updG, rnmGrid, setRnmGrid, rnmVal, setRnmVal,
  fsPx, szPxOf, cellWOf, cellHOf, child,
}) {
  const maxCellH = cellHOf(0)

  return (
    <div style={{ flex:1, overflow:'auto', padding:'1.4rem 1.6rem' }}>
      {/* ── Barre d'info ────────────────────────────────────────── */}
      <div style={{
        marginBottom:14, display:'flex', alignItems:'center',
        gap:8, flexWrap:'wrap',
      }}>
        <span style={{ fontSize:13, fontWeight:500 }}>
          Planning de <b style={{ color:'#2B7BE9' }}>{child||'…'}</b>
          <span style={{ color:'#94A3B8', fontWeight:400 }}> — </span>
          {cur?.name}
        </span>

        {!rnmGrid && (
          <button
            onClick={() => { setRnmGrid(true); setRnmVal(cur?.name||'') }}
            style={{
              fontSize:11, color:'#64748B',
              border:'1px solid rgba(0,0,0,.1)',
              background:'#F5F6F9', borderRadius:6,
              padding:'2px 8px', cursor:'pointer',
            }}
          >✏ Renommer</button>
        )}

        <span style={{ fontSize:11, color:'#94A3B8' }}>
          {nR} ligne{nR>1?'s':''} × {nC} col{nC>1?'s':''}
        </span>

        {target && (
          <span style={{
            fontSize:11, color:'#085041',
            background:'#E1F5EE', padding:'2px 10px',
            borderRadius:12, border:'1px solid #9FE1CB',
          }}>
            📍 Ligne {target.r+1}, Col {target.c+1}
          </span>
        )}

        <span style={{
          fontSize:11, color:'#92400E',
          background:'#FEF3C7', padding:'2px 9px',
          borderRadius:10, border:'1px solid #FDE68A',
          marginLeft:'auto',
        }}>
          ✋ Maintenir → glisser (copie la cellule)
        </span>
      </div>

      {/* ── Grille + contrôles ──────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:6 }}>

        {/* Boutons supprimer ligne */}
        <div style={{
          display:'flex', flexDirection:'column', gap:8,
          paddingTop:34, flexShrink:0,
        }}>
          {cur?.cells.map((_,r) => (
            <div key={r} style={{
              height:maxCellH,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <DelBtn onClick={() => delRow(r)} disabled={nR<=1} title="Supprimer cette ligne" />
            </div>
          ))}
        </div>

        <div>
          {/* En-tête colonnes */}
          <div style={{ display:'flex', gap:8, marginBottom:6 }}>
            {cur?.cells[0]?.map((_,c) => (
              <div key={c} style={{
                width:cellWOf(c),
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              }}>
                <span style={{ fontSize:9, color:'#94A3B8', fontWeight:500 }}>Col {c+1}</span>
                <DelBtn onClick={() => delCol(c)} disabled={nC<=1} title="Supprimer cette colonne" />
              </div>
            ))}
            <button onClick={addCol} title="Ajouter une colonne"
              style={{
                width:26, alignSelf:'flex-end', padding:'4px 3px',
                borderRadius:7, border:'1px solid rgba(0,0,0,.12)',
                background:'#F5F6F9', color:'#64748B',
                cursor:'pointer', fontSize:15, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'background .12s, color .12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='#E1F5EE'; e.currentTarget.style.color='#085041' }}
              onMouseLeave={e => { e.currentTarget.style.background='#F5F6F9'; e.currentTarget.style.color='#64748B' }}
            >+</button>
          </div>

          {/* Grille */}
          <div style={{
            display:'inline-grid',
            gridTemplateColumns:Array.from({length:nC},(_,c) => cellWOf(c)+'px').join(' '),
            gap:8, background:bg, borderRadius:16,
            border:'1px solid rgba(0,0,0,.08)',
            padding:14,
            boxShadow:'0 2px 12px rgba(0,0,0,.05)',
          }}>
            {cur?.cells.flatMap((row,r) => row.map((cell,c) => {
              const isTgt = target?.r===r && target?.c===c
              const isOvr = dragOvr?.r===r && dragOvr?.c===c
              const isClr = clrFor?.r===r && clrFor?.c===c
              const szPx  = szPxOf(c)
              const wPx   = cellWOf(c)
              const hPx   = cellHOf(c)

              return (
                <div key={`${r}_${c}`}
                  style={{ width:wPx, minHeight:hPx, display:'flex',
                    flexDirection:'column', alignItems:'center', gap:4, position:'relative',
                    justifyContent:'flex-end' }}
                  onDragOver={e => onDragOver(e,r,c)}
                  onDragLeave={onDragLeave}
                  onDrop={e => onDrop(e,r,c)}>

                  {cell ? (
                    <div className="picto-wrap">
                      {/* Cellule remplie */}
                      <div
                        draggable
                        className="picto-box"
                        onDragStart={e => onDragStart(e,r,c)}
                        onDragEnd={onDragEnd}
                        onClick={() => openCell(r,c)}
                        style={{
                          width:szPx, height:szPx,
                          background: isOvr ? '#E1F5EE' : cell.color,
                          borderRadius:12,
                          border: isTgt
                            ? '2.5px solid #5DCAA5'
                            : isOvr
                            ? '2.5px solid #5DCAA5'
                            : borders
                            ? '1px solid rgba(0,0,0,.08)'
                            : 'none',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          cursor:'grab', position:'relative',
                          userSelect:'none', overflow:'hidden',
                          boxShadow: isTgt ? '0 0 0 3px rgba(93,202,165,.25)' : 'none',
                        }}
                      >
                        <PictoCell cell={cell} sz={szPx} />
                        {isOvr && (
                          <div style={{
                            position:'absolute', inset:0, borderRadius:11,
                            background:'rgba(93,202,165,.18)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:szPx*.3, pointerEvents:'none',
                          }}>📋</div>
                        )}
                      </div>

                      {/* Bouton supprimer (visible au hover via CSS) */}
                      <button
                        className="picto-del"
                        onClick={e => { e.stopPropagation(); setCell(r,c,null); setTarget(null) }}
                        style={{
                          position:'absolute', top:-9, right:-9,
                          width:22, height:22, borderRadius:'50%',
                          background:'#FEE2E2', border:'1.5px solid #FCA5A5',
                          color:'#991B1B', fontSize:13, fontWeight:700,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          cursor:'pointer', padding:0, zIndex:20,
                        }}
                        title="Supprimer"
                      >×</button>

                      {/* Étiquette */}
                      {labels && (
                        <span
                          onClick={() => {
                            const v = window.prompt('Nom du pictogramme :', cell.label||'')
                            if (v !== null) setCellP(r,c,'label',v)
                          }}
                          style={{
                            fontSize:fsPx, fontWeight:500, textAlign:'center',
                            maxWidth:wPx-4, cursor:'text', lineHeight:1.3,
                            display:'block', padding:'1px 2px',
                            userSelect:'none', color:'#1A1D23',
                          }}
                        >{cell.label}</span>
                      )}

                      {/* Bouton couleur (visible au hover via CSS) */}
                      <button
                        className="picto-clr picto-color-btn"
                        onClick={e => { e.stopPropagation(); setClrFor(isClr ? null : {r,c}) }}
                        style={{
                          width:20, height:20, borderRadius:5, background:cell.color,
                          border: isClr ? '1.5px solid #5DCAA5' : '.5px solid rgba(0,0,0,.15)',
                          cursor:'pointer', padding:0,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:9,
                        }}
                        title="Changer la couleur de fond"
                      >🎨</button>

                      {/* Sélecteur couleur */}
                      {isClr && (
                        <ColorPicker cell={cell} onSelect={p => { setCellP(r,c,'color',p); setClrFor(null) }} />
                      )}
                    </div>
                  ) : (
                    /* Cellule vide — marginBottom = footer d'une cellule remplie
                       (gap + étiquette + gap + bouton couleur) pour aligner les bas */
                    <div
                      className="picto-empty"
                      onClick={() => openCell(r,c)}
                      onDragOver={e => onDragOver(e,r,c)}
                      style={{
                        width:szPx, height:szPx, borderRadius:12,
                        marginBottom: labels ? Math.round(fsPx * 1.3) + 30 : 24,
                        border: isOvr
                          ? '2.5px solid #5DCAA5'
                          : isTgt
                          ? '2px dashed #5DCAA5'
                          : '1.5px dashed rgba(0,0,0,.18)',
                        background: isOvr ? '#E1F5EE' : isTgt ? '#F0FAF6' : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize: isOvr ? szPx*.35 : 22,
                        color: isOvr ? '#5DCAA5' : isTgt ? '#5DCAA5' : '#CBD5E1',
                        cursor:'pointer',
                      }}
                    >
                      {isOvr ? '📋' : '+'}
                    </div>
                  )}
                </div>
              )
            }))}
          </div>

          {/* Bouton ajouter ligne */}
          <button
            onClick={addRow}
            style={{
              marginTop:12, padding:'7px 16px', borderRadius:9,
              border:'1px solid rgba(0,0,0,.1)', background:'#F5F6F9',
              color:'#64748B', cursor:'pointer', fontSize:12, fontWeight:500,
              display:'flex', alignItems:'center', gap:5, width:'fit-content',
              transition:'background .12s, color .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='#E1F5EE'; e.currentTarget.style.color='#085041' }}
            onMouseLeave={e => { e.currentTarget.style.background='#F5F6F9'; e.currentTarget.style.color='#64748B' }}
          >
            + Ajouter une ligne
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Bouton supprimer (ligne ou colonne) ─────────────────────────── */
function DelBtn({ onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width:18, height:18, borderRadius:'50%',
        fontSize:11, fontWeight:700, padding:0,
        border: disabled ? '.5px solid rgba(0,0,0,.1)' : '1px solid #FCA5A5',
        background: disabled ? '#eee' : '#FEE2E2',
        color: disabled ? '#CBD5E1' : '#EF4444',
        cursor: disabled ? 'default' : 'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        transition:'background .12s',
      }}
    >×</button>
  )
}
