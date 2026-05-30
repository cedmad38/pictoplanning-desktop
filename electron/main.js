const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron')
const path = require('path')
const fs   = require('fs')
const { autoUpdater } = require('electron-updater')

const isDev = process.env.ELECTRON_DEV === 'true'

/* ── Mises à jour automatiques ──────────────────────────────────── */
function setupAutoUpdater(win) {
  if (isDev) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', info => {
    dialog.showMessageBox(win, {
      type:    'info',
      title:   'Mise à jour disponible',
      message: `Une nouvelle version (v${info.version}) est disponible.`,
      detail:  'Le téléchargement démarre en arrière-plan. Vous serez averti quand il sera prêt.',
      buttons: ['OK'],
    })
  })

  autoUpdater.on('update-downloaded', info => {
    dialog.showMessageBox(win, {
      type:    'info',
      title:   'Mise à jour prête',
      message: `PictoPlanning v${info.version} est prête à être installée.`,
      detail:  'Cliquez sur "Redémarrer" pour appliquer la mise à jour maintenant.',
      buttons: ['Redémarrer', 'Plus tard'],
      defaultId: 0,
    }).then(result => {
      if (result.response === 0) autoUpdater.quitAndInstall()
    })
  })

  autoUpdater.on('error', err => {
    console.error('Erreur mise à jour :', err?.message)
    dialog.showMessageBox(win, {
      type:    'warning',
      title:   'Erreur de mise à jour',
      message: 'La mise à jour a échoué.',
      detail:  err?.message || 'Erreur inconnue. Vous pouvez télécharger la mise à jour manuellement sur github.com/cedmad38/pictoplanning-desktop',
      buttons: ['OK'],
    })
  })

  // Vérifier 5 secondes après le démarrage (laisse le temps à la fenêtre de charger)
  setTimeout(() => autoUpdater.checkForUpdates(), 5000)
}

/* ── Protocole local-file:// pour afficher les pictos locaux ────── */
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-file', privileges: { secure: true, supportFetchAPI: true, bypassCSP: true } },
])

/* ── Fenêtre principale ─────────────────────────────────────────── */
function createWindow() {
  const win = new BrowserWindow({
    width:    1280,
    height:   820,
    minWidth: 900,
    minHeight:600,
    title:    'PictoPlanning',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  /* Servir les fichiers locaux via local-file:// */
  protocol.handle('local-file', async (request) => {
    try {
      const url      = new URL(request.url)
      let   filePath = decodeURIComponent(url.pathname)
      // Windows : /C:/chemin → C:/chemin
      if (process.platform === 'win32' && /^\/[A-Za-z]:\//.test(filePath)) {
        filePath = filePath.slice(1)
      }
      const data = fs.readFileSync(filePath)
      const ext  = path.extname(filePath).toLowerCase()
      const mime = { '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
                     '.svg':'image/svg+xml', '.gif':'image/gif', '.webp':'image/webp',
                     '.bmp':'image/bmp' }[ext] || 'application/octet-stream'
      return new Response(data, { headers: { 'Content-Type': mime } })
    } catch {
      return new Response('Fichier introuvable', { status: 404 })
    }
  })

  const win = createWindow()
  setupAutoUpdater(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

/* ── Helpers ────────────────────────────────────────────────────── */
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.bmp'])

function cleanName(filename, ext) {
  return path.basename(filename, ext)
    .replace(/[_-]/g, ' ')
    .replace(/^\d+\s*/, '')
    .trim() || path.basename(filename, ext)
}

function readImagesRecursive(folderPath, subfolder = null) {
  const results = []
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const fullPath = path.join(folderPath, entry.name)
      if (entry.isDirectory()) {
        const sub = subfolder ? `${subfolder}/${entry.name}` : entry.name
        results.push(...readImagesRecursive(fullPath, sub))
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (IMAGE_EXTS.has(ext)) {
          results.push({
            name:      cleanName(entry.name, ext),
            path:      fullPath.replace(/\\/g, '/'),
            subfolder: subfolder,
          })
        }
      }
    }
  } catch (e) {
    console.error('Erreur lecture dossier :', e.message)
  }
  return results
}

/* ── Handlers IPC ───────────────────────────────────────────────── */

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title:      'Choisir un dossier de pictogrammes',
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('folder:readImages', async (_, folderPath) => {
  return readImagesRecursive(folderPath)
})

ipcMain.handle('file:readAsBase64', async (_, filePath) => {
  try {
    return fs.readFileSync(filePath).toString('base64')
  } catch {
    return null
  }
})

ipcMain.handle('dialog:openImage', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    title:      'Choisir une image',
    filters:    [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }],
  })
  if (result.canceled) return null
  try {
    const filePath = result.filePaths[0]
    const data     = fs.readFileSync(filePath)
    const ext      = path.extname(filePath).toLowerCase().slice(1)
    const mime     = { png:'image/png', gif:'image/gif', webp:'image/webp' }[ext] || 'image/jpeg'
    return { dataUrl: `data:${mime};base64,${data.toString('base64')}` }
  } catch {
    return null
  }
})

ipcMain.handle('dialog:saveJSON', async (_, data) => {
  const result = await dialog.showSaveDialog({
    title:       'Enregistrer le planning',
    defaultPath: 'planning-pictoplanning.json',
    filters:     [{ name: 'Planning PictoPlanning', extensions: ['json'] }],
  })
  if (result.canceled) return false
  try {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch {
    return false
  }
})

ipcMain.handle('dialog:openJSON', async () => {
  const result = await dialog.showOpenDialog({
    title:      'Ouvrir un planning',
    filters:    [{ name: 'Planning PictoPlanning', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (result.canceled) return null
  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
})
