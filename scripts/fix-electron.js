/**
 * fix-electron.js
 * Corrige l'installation du binaire Electron si le dossier Frameworks est absent.
 * Exécuter avec : node scripts/fix-electron.js
 */

const { execSync } = require('child_process')
const fs   = require('fs')
const path = require('path')
const os   = require('os')

const electronDir    = path.join(__dirname, '../node_modules/electron')
const distDir        = path.join(electronDir, 'dist')
const frameworksDir  = path.join(distDir, 'Electron.app/Contents/Frameworks')
const pathTxtFile    = path.join(electronDir, 'path.txt')

// Lire la version installée
let version
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(electronDir, 'package.json'), 'utf8'))
  version = pkg.version
} catch {
  console.error('❌ Impossible de lire la version Electron.')
  process.exit(1)
}

// Vérifier si le binaire est complet
if (fs.existsSync(frameworksDir) && fs.existsSync(pathTxtFile)) {
  console.log(`✅ Electron v${version} est correctement installé.`)
  process.exit(0)
}

console.log(`🔧 Réparation d'Electron v${version}...`)

// Chercher le zip en cache
const platform  = process.platform === 'darwin' ? 'darwin' : process.platform === 'win32' ? 'win32' : 'linux'
const arch      = process.arch === 'arm64' ? 'arm64' : 'x64'
const zipName   = `electron-v${version}-${platform}-${arch}.zip`

const cacheDirs = [
  path.join(os.homedir(), 'Library/Caches/electron'),
  path.join(os.homedir(), '.electron'),
  path.join(os.homedir(), '.cache/electron'),
]

let zipPath = null
for (const dir of cacheDirs) {
  if (!fs.existsSync(dir)) continue
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const candidate = e.isDirectory()
      ? path.join(dir, e.name, zipName)
      : path.join(dir, e.name)
    if (fs.existsSync(candidate) && candidate.endsWith('.zip')) {
      zipPath = candidate
      break
    }
  }
  if (zipPath) break
}

if (!zipPath) {
  console.error(`❌ ZIP introuvable en cache. Essayez : rm -rf node_modules/electron && npm install`)
  process.exit(1)
}

console.log(`📦 ZIP trouvé : ${zipPath}`)
fs.rmSync(distDir, { recursive: true, force: true })
fs.mkdirSync(distDir, { recursive: true })

try {
  execSync(`unzip -q "${zipPath}" -d "${distDir}"`, { stdio: 'inherit' })
} catch {
  console.error('❌ Échec de la décompression.')
  process.exit(1)
}

const execName = platform === 'darwin'
  ? 'Electron.app/Contents/MacOS/Electron'
  : platform === 'win32' ? 'electron.exe' : 'electron'

fs.writeFileSync(pathTxtFile, execName)
console.log(`✅ Electron v${version} réparé avec succès !`)
