import { useState, useRef, useEffect, useCallback } from 'react'
import { useHistory } from './hooks/useHistory'
import { Toolbar }        from './components/Toolbar'
import { GridTabs }       from './components/GridTabs'
import { GridArea }       from './components/GridArea'
import { LibraryPanel }   from './components/LibraryPanel'
import { SettingsSidebar }from './components/SettingsSidebar'
import { Toast }          from './components/Toast'
import { PrintPreview }   from './components/PrintPreview'
import { STORAGE_KEY, CM, ARASAAC_IMG, isElectron } from './constants'
import { nid, initGrid } from './utils'

/* ── Sauvegarde locale ───────────────────────────────────────────── */
const loadSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

/* ── App ─────────────────────────────────────────────────────────── */
export default function App() {
  const _s = loadSaved()

  /* ── Paramètres d'affichage ─────────────────────────────────── */
  const [sz1Cm,  setSz1Cm]  = useState(_s?.sz1Cm  ?? 4)
  const [szNCm,  setSzNCm]  = useState(_s?.szNCm  ?? 3)
  const [fsCm,   setFsCm]   = useState(_s?.fsCm   ?? 0.3)
  const [labels,  setLabels]  = useState(_s?.labels  ?? true)
  const [borders, setBorders] = useState(_s?.borders ?? true)
  const [bg,     setBg]     = useState(_s?.bg     ?? '#FFFFFF')
  const [child,  setChild]  = useState(_s?.child  ?? 'Lucas')

  /* ── UI ─────────────────────────────────────────────────────── */
  const [showLib,      setShowLib]      = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [target,       setTarget]       = useState(null)
  const [clrFor,       setClrFor]       = useState(null)
  const [gid,          setGid]          = useState(_s?.gid ?? 'g1')
  const [rnmGrid,      setRnmGrid]      = useState(false)
  const [rnmVal,       setRnmVal]       = useState('')
  const [toast,        setToast]        = useState(null)
  const [printHtml,    setPrintHtml]    = useState(null)   /* null = modale fermée */

  /* ── Drag & drop ────────────────────────────────────────────── */
  const dragSrc = useRef(null)
  const [dragOvr, setDragOvr] = useState(null)

  /* ── Grilles avec historique (undo/redo) ────────────────────── */
  const { grids, setGrids, undo, redo, canUndo, canRedo } = useHistory(
    _s?.grids ?? [{ id:'g1', name:'Planning du matin', cells:initGrid() }]
  )

  /* ── Auto-save ──────────────────────────────────────────────── */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        child, grids, gid, sz1Cm, szNCm, fsCm, labels, borders, bg
      }))
    } catch {}
  }, [child, grids, gid, sz1Cm, szNCm, fsCm, labels, borders, bg])

  /* ── Grille courante ────────────────────────────────────────── */
  const cur = grids.find(g => g.id === gid)
  const nR  = cur?.cells.length || 0
  const nC  = cur?.cells[0]?.length || 0

  /* ── Dimensions ─────────────────────────────────────────────── */
  const fsPx    = Math.round(fsCm * CM)
  const szPxOf  = c => Math.round((c === 0 ? sz1Cm : szNCm) * CM)
  const cellWOf = c => szPxOf(c) + 20
  const cellHOf = () => szPxOf(0) + (labels ? fsPx*2+14 : 8) + 30

  /* ── Mutations de grille (toutes undoables) ─────────────────── */
  const updG     = (id, fn) => setGrids(prev => prev.map(g => g.id===id ? fn(g) : g))
  const updCells = fn => setGrids(prev => prev.map(g => g.id!==gid ? g : { ...g, cells:fn(g.cells) }))
  const setCell  = (r,c,v) => updCells(cells => cells.map((row,ri) => ri!==r ? row : row.map((cel,ci) => ci!==c ? cel : v)))
  const setCellP = (r,c,k,v) => setCell(r,c, cur?.cells[r]?.[c] ? { ...cur.cells[r][c],[k]:v } : null)
  const addRow   = () => updCells(cells => [...cells, Array(nC).fill(null)])
  const addCol   = () => updCells(cells => cells.map(row => [...row, null]))
  const delRow   = r => { if (nR > 1) updCells(cells => cells.filter((_,i) => i!==r)) }
  const delCol   = c => { if (nC > 1) updCells(cells => cells.map(row => row.filter((_,i) => i!==c))) }

  /* ── Bibliothèque ───────────────────────────────────────────── */
  const openCell = (r,c) => { setTarget({r,c}); setClrFor(null); setShowLib(true) }
  const addPicto = cell  => { if (target) setCell(target.r, target.c, cell) }

  /* ── Drag & drop : copier ───────────────────────────────────── */
  const onDragStart = (e,r,c) => { dragSrc.current={r,c}; e.dataTransfer.effectAllowed='copy' }
  const onDragOver  = (e,r,c) => { e.preventDefault(); e.dataTransfer.dropEffect='copy'; setDragOvr({r,c}) }
  const onDragLeave = () => setDragOvr(null)
  const onDragEnd   = () => { dragSrc.current=null; setDragOvr(null) }
  const onDrop = (e,r,c) => {
    e.preventDefault(); setDragOvr(null)
    const src = dragSrc.current
    if (!src || (src.r===r && src.c===c)) { dragSrc.current=null; return }
    dragSrc.current = null
    const srcCell = cur?.cells[src.r]?.[src.c]
    if (!srcCell) return
    setCell(r, c, { ...srcCell, uid:nid() })
  }

  /* ── Gestion des plannings ──────────────────────────────────── */
  const addGrid = () => {
    const id = 'g'+nid()
    setGrids(prev => [...prev, { id, name:'Nouveau planning', cells:[[null,null],[null,null]] }])
    setGid(id)
  }
  const delGrid = id => {
    if (grids.length === 1) return
    setGrids(prev => prev.filter(g => g.id!==id))
    if (gid === id) setGid(grids.find(g => g.id!==id)?.id)
  }

  /* ── Toast ──────────────────────────────────────────────────── */
  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type, key:Date.now() })
  }, [])

  /* ── Sauvegarde JSON ────────────────────────────────────────── */
  const saveJSON = useCallback(async () => {
    if (!isElectron) return
    const ok = await window.electronAPI.saveJSON({ child, grids })
    showToast(ok ? 'Planning enregistré' : 'Erreur lors de l\'enregistrement', ok ? 'success' : 'error')
  }, [child, grids, showToast])

  const loadJSON = useCallback(async () => {
    if (!isElectron) return
    const data = await window.electronAPI.openJSON()
    if (!data) return
    if (data.child) setChild(data.child)
    if (data.grids && Array.isArray(data.grids)) {
      setGrids(data.grids)
      setGid(data.grids[0]?.id || 'g1')
    }
    showToast('Planning chargé')
  }, [setGrids, showToast])

  /* ── Impression ─────────────────────────────────────────────── */
  const printPlanning = useCallback(() => {
    const usedCols = Array.from({ length:nC }, (_,c) =>
      cur?.cells.some(row => row[c]) ? c : -1
    ).filter(c => c >= 0)

    const cellHTML = cur?.cells.flatMap((row,r) => usedCols.map(c => {
      const cell = row[c]
      const sz   = c === 0 ? sz1Cm : szNCm
      const boxS = `width:${sz}cm;height:${sz}cm`
      if (!cell) return `<div class="cell"><div class="box" style="${boxS};border:none"></div></div>`
      const img = cell.arasaacId
        ? `<img src="${ARASAAC_IMG(cell.arasaacId)}" style="width:${sz*.86}cm;height:${sz*.86}cm;object-fit:contain"/>`
        : cell.imageData
        ? `<img src="${cell.imageData}" style="width:${sz*.86}cm;height:${sz*.86}cm;object-fit:cover;border-radius:.12cm"/>`
        : `<span style="font-size:${sz*.5}cm">${cell.emoji||''}</span>`
      return `<div class="cell">
        <div class="box" style="${boxS};background:${cell.color}">${img}</div>
        ${labels ? `<div class="lbl" style="max-width:${sz}cm">${cell.label||''}</div>` : ''}
      </div>`
    })).join('\n')

    const html = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8"/>
<style>
  body { font-family:-apple-system,sans-serif; padding:1cm; background:${bg}; margin:0; }
  h2   { font-size:18px; margin-bottom:4px; color:#1A1D23; }
  .sub { font-size:10px; color:#94A3B8; margin-bottom:16px; }
  .grid{ display:grid; grid-template-columns:${usedCols.map(c=>c===0?sz1Cm:szNCm).map(s=>s+'cm').join(' ')}; gap:.3cm; }
  .cell{ display:flex; flex-direction:column; align-items:center; gap:.1cm; }
  .box { border-radius:.2cm; display:flex; align-items:center; justify-content:center; overflow:hidden;
         border:${borders?'1px solid rgba(0,0,0,.1)':'none'}; }
  .lbl { font-size:${fsCm}cm; font-weight:500; text-align:center; line-height:1.3; color:#1A1D23; }
  .footer{ margin-top:.8cm; font-size:8px; color:#94A3B8; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head><body>
<h2>Planning de ${child||'…'}</h2>
<div class="sub">PictoPlanning — ${cur?.name}</div>
<div class="grid">${cellHTML}</div>
<div class="footer">© Sergio Palao / ARASAAC – CC BY-NC-SA 4.0</div>
</body></html>`

    /* Afficher la prévisualisation plutôt que d'imprimer directement */
    setPrintHtml(html)
  }, [cur, child, nC, sz1Cm, szNCm, fsCm, labels, borders, bg])

  /* ── Impression réelle (depuis la modale) ───────────────────── */
  const executePrint = useCallback(() => {
    const html = printHtml
    if (!html) return
    setPrintHtml(null)
    const w = window.open('', '_blank')
    if (!w) { alert('Autorisez les popups pour imprimer.'); return }
    w.document.write(html); w.document.close(); w.focus()
    setTimeout(() => { w.print(); w.close() }, 400)
  }, [printHtml])

  /* ── Raccourcis clavier ─────────────────────────────────────── */
  const handlerRef = useRef()
  handlerRef.current = e => {
    const ctrl = e.ctrlKey || e.metaKey
    if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
    if (ctrl && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    if (ctrl && e.key === 'y') { e.preventDefault(); redo() }
    if (ctrl && e.key === 's') { e.preventDefault(); saveJSON() }
    if (ctrl && e.key === 'p') { e.preventDefault(); printPlanning() }
    if (ctrl && e.key === 'b') { e.preventDefault(); setShowLib(l => !l) }
    if (e.key === 'Escape') {
      setShowLib(false); setShowSettings(false)
      setTarget(null); setClrFor(null)
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') &&
        !['INPUT','TEXTAREA'].includes(e.target.tagName)) {
      if (target) { setCell(target.r, target.c, null); setTarget(null) }
    }
  }
  useEffect(() => {
    const fn = e => handlerRef.current(e)
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  /* ── Rendu ──────────────────────────────────────────────────── */
  return (
    <div style={{
      fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display:'flex', flexDirection:'column',
      height:'100vh', overflow:'hidden',
      background:'#F4F5F8',
    }}>
      <Toolbar
        child={child} setChild={setChild}
        canUndo={canUndo} canRedo={canRedo}
        onUndo={undo} onRedo={redo}
        showLib={showLib}      onToggleLib={()      => setShowLib(l => !l)}
        showSettings={showSettings} onToggleSettings={() => setShowSettings(s => !s)}
        isElectron={isElectron}
        onSave={saveJSON} onLoad={loadJSON} onPrint={printPlanning}
      />

      <GridTabs
        grids={grids} gid={gid} setGid={setGid}
        addGrid={addGrid} delGrid={delGrid}
        rnmGrid={rnmGrid} setRnmGrid={setRnmGrid}
        rnmVal={rnmVal}   setRnmVal={setRnmVal}
        updG={updG}
      />

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {showSettings && (
          <SettingsSidebar
            sz1Cm={sz1Cm} setSz1Cm={setSz1Cm}
            szNCm={szNCm}  setSzNCm={setSzNCm}
            fsCm={fsCm}    setFsCm={setFsCm}
            labels={labels}   setLabels={setLabels}
            borders={borders} setBorders={setBorders}
            bg={bg}           setBg={setBg}
            onClose={() => setShowSettings(false)}
          />
        )}

        <GridArea
          cur={cur} gid={gid} nR={nR} nC={nC}
          sz1Cm={sz1Cm} szNCm={szNCm} fsCm={fsCm}
          labels={labels} borders={borders} bg={bg}
          target={target}   setTarget={setTarget}
          clrFor={clrFor}   setClrFor={setClrFor}
          dragOvr={dragOvr}
          onDragStart={onDragStart} onDragOver={onDragOver}
          onDragLeave={onDragLeave} onDrop={onDrop} onDragEnd={onDragEnd}
          openCell={openCell}
          setCell={setCell} setCellP={setCellP}
          addRow={addRow} addCol={addCol}
          delRow={delRow} delCol={delCol}
          updG={updG}
          rnmGrid={rnmGrid} setRnmGrid={setRnmGrid}
          rnmVal={rnmVal}   setRnmVal={setRnmVal}
          fsPx={fsPx} szPxOf={szPxOf}
          cellWOf={cellWOf} cellHOf={cellHOf}
          child={child}
        />

        {showLib && (
          <LibraryPanel
            target={target}
            onClose={() => setShowLib(false)}
            onAddPicto={addPicto}
          />
        )}
      </div>

      {toast && (
        <Toast
          key={toast.key}
          message={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}

      {printHtml && (
        <PrintPreview
          html={printHtml}
          onClose={() => setPrintHtml(null)}
          onPrint={executePrint}
        />
      )}
    </div>
  )
}
