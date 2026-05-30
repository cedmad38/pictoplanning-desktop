# Contexte PictoPlanning Desktop — À lire au début de chaque session

## Projet

**PictoPlanning Desktop** — logiciel Electron gratuit de planning visuel par pictogrammes pour enfants handicapés.

- **Dossier local :** `/Users/cedmad/Projets/PictoPlanning-Desktop/`
- **GitHub :** https://github.com/cedmad38/pictoplanning-desktop
- **Compte GitHub :** cedmad38
- **Développeur :** Cedmad (débutant Mac, MacBook, Xcode + Node, compte Apple Developer actif)

---

## Stack technique

| Outil | Version |
|---|---|
| Electron | 28 |
| React | 18 |
| Vite | 5 |
| electron-builder | 24 |
| electron-updater | 6 |

Build via **GitHub Actions** — 2 workflows séparés :
- `.github/workflows/build-mac.yml` → DMG universel, notarisé Apple
- `.github/workflows/build-windows.yml` → NSIS installer

---

## Secrets GitHub configurés (ne jamais les modifier)

| Secret | Valeur |
|---|---|
| `CSC_LINK` | Certificat Developer ID (expire 2031) |
| `CSC_KEY_PASSWORD` | `pictoplanning123` |
| `APPLE_ID` | `cedmad@hotmail.com` |
| `APPLE_APP_SPECIFIC_PASSWORD` | `laxb-yusv-vbgc-gnbg` |
| `APPLE_TEAM_ID` | `Z4SN2WPF27` |

---

## Procédure pour publier une nouvelle version

1. Modifier le code
2. Changer la version dans `package.json`
3. `git add . && git commit -m "vX.X.X — description"`
4. `git push`
5. Créer la release GitHub avec le tag `vX.X.X`
6. Lancer les 2 workflows (Mac + Windows) manuellement depuis GitHub Actions

> ⚠️ Le workflow Mac a **2 jobs séparés** (build+submit / staple+upload) car Apple met parfois 25-30 min pour notariser. Le matin c'est plus rapide (~5 min).

---

## État des versions

| Version | Statut |
|---|---|
| **v1.1.0** | ✅ En production — Mac notarisé + Windows sur GitHub Releases |
| **v1.2.0** | 🟡 Terminée localement, **pas encore commitée ni publiée** |

---

## Structure du code (v1.2.0)

Le code a été entièrement restructuré lors de la dernière session (avant : 1 fichier de 1055 lignes, après : 14 fichiers organisés).

```
src/
  App.jsx                 ← orchestrateur principal (~220 lignes), tout l'état y est
  index.css               ← design system : variables CSS, animations, classes hover
  constants.js            ← ARASAAC_SEARCH, ARASAAC_IMG, QUICK_CATS, PALETTE, PAL_NAMES,
                             STORAGE_KEY, CM (37.795 px/cm), isElectron
  utils.js                ← nid(), rndC(), mkArasaac(), mkEmoji(), mkPhoto(),
                             localFileUrl(), squareCrop(), resizeOnly(), initGrid()
  hooks/
    useHistory.js         ← undo/redo (40 étapes max), expose : grids, setGrids,
                             undo, redo, canUndo, canRedo
  components/
    Toolbar.jsx           ← barre d'outils : logo, prénom, undo/redo, Réglages,
                             Bibliothèque, Ouvrir, Enregistrer, Imprimer
    GridTabs.jsx          ← onglets des plannings (double-clic = renommer)
    GridArea.jsx          ← grille principale avec contrôles lignes/colonnes,
                             cellules remplies/vides, sélecteur couleur popup
    SettingsSidebar.jsx   ← panneau gauche : steppers tailles, toggles iOS
                             (étiquettes/bordures), palette couleurs fond
    LibraryPanel.jsx      ← panneau droit : 3 onglets (ARASAAC, Galerie, Photo)
    LocalGalleryTab.jsx   ← galerie locale : ouvrir dossier, filtres sous-dossiers
    PhotoTab.jsx          ← photo perso : recadrer carré ou plein cadre
    PrintPreview.jsx      ← modale aperçu avant impression (iframe srcDoc,
                             bouton Imprimer déclenche window.open + print)
    Toast.jsx             ← notifications toast animées (coin bas-droit, 2.6s)

electron/
  main.js                 ← fenêtre principale, protocole local-file://, autoUpdater,
                             handlers IPC (openFolder, readImages, saveJSON, openJSON…)
  preload.js              ← expose window.electronAPI au renderer
```

---

## Fonctionnalités complètes de l'app

- Grille de pictogrammes avec drag & drop **(copie)**
- Bibliothèque ARASAAC via API (+14 000 pictos, recherche FR + catégories rapides)
- Galerie locale (dossier PC, sous-dossiers, filtre)
- Photos personnelles (recadrage carré ou plein cadre)
- Multi-plannings (onglets, renommer double-clic, ajouter/supprimer)
- Impression avec **aperçu dans l'app** avant la boîte de dialogue système
- Sauvegarde/chargement JSON
- Sauvegarde automatique dans localStorage à chaque changement
- Mise à jour automatique via electron-updater → GitHub Releases
- **Undo/Redo** : Ctrl+Z / Ctrl+Y (40 étapes, toutes mutations de grille)
- **Raccourcis clavier** : Ctrl+S (save), Ctrl+P (print), Ctrl+B (bibliothèque),
  Échap (fermer panneaux), Suppr/Backspace (vider cellule sélectionnée)
- Panneau Réglages : tailles cellules (col 1 / autres), taille texte, toggles étiquettes/bordures, couleur de fond
- Alignement par le bas des cellules de tailles différentes dans une même ligne
- Cellules : hover = lift + ombre, bouton supprimer visible au hover, bouton couleur visible au hover
- Toast notifications (success/error/info)

---

## Design system (index.css)

Variables CSS principales :
```css
--bg: #F4F5F8          /* fond app */
--surface: #FFFFFF     /* cartes/panneaux */
--surface-2: #F5F6F9   /* inputs, zones subtiles */
--text: #1A1D23
--text-muted: #64748B
--accent: #5DCAA5      /* vert menthe — couleur principale */
--accent-light: #E1F5EE
--accent-dark: #085041
--primary: #2B7BE9     /* bleu — logo "Picto" */
--danger: #EF4444
```

Classes CSS utiles :
- `.picto-wrap:hover .picto-del` → affiche bouton supprimer
- `.picto-wrap:hover .picto-box` → lift + ombre
- `.picto-wrap:hover .picto-clr` → affiche bouton couleur
- `.picto-empty:hover` → fond vert + bordure accent
- `.lib-btn:hover` → lift + ombre (pictos bibliothèque)
- `.slide-left` / `.slide-right` → animations entrée panneaux

---

## Logique importante à connaître

### État global (App.jsx)
Tout l'état applicatif est dans `App.jsx`. Les composants reçoivent des props.

### Undo/Redo (useHistory.js)
Toutes les mutations de grille passent par `setGrids` (depuis `useHistory`), ce qui les rend annulables. Les changements de réglages (taille, couleurs...) ne sont pas dans l'historique.

### Drag & drop
Comportement : **copier** (la cellule source reste, la destination reçoit une copie).
`effectAllowed = 'copy'`

### Alignement bas des cellules
- Toutes les cellules ont `justifyContent: 'flex-end'` → contenu poussé vers le bas
- Les cellules vides ont `marginBottom: labels ? Math.round(fsPx * 1.3) + 30 : 24` pour simuler l'espace occupé par étiquette + bouton couleur dans les cellules remplies → aligne les bas des pictos

### Impression
1. Clic "Imprimer" ou Ctrl+P → `printPlanning()` génère le HTML et stocke dans `printHtml` state
2. Modale `PrintPreview` s'ouvre avec `<iframe srcDoc={html}>`
3. Clic "Imprimer" dans la modale → `executePrint()` → `window.open + w.print()`

### Attribution ARASAAC (obligatoire partout)
```
© Sergio Palao / ARASAAC – CC BY-NC-SA 4.0
```
Doit apparaître dans l'app (pied de page bibliothèque + impression) et dans la description App Store.

---

## Ce qui reste à faire (v1.2.0)

- [ ] Tester toutes les fonctionnalités (drag, undo, impression, bibliothèque...)
- [ ] Corriger les éventuels bugs trouvés lors des tests
- [ ] `git add . && git commit -m "v1.2.0 — Refonte design, UX, restructuration code"`
- [ ] `git push`
- [ ] Créer la release GitHub `v1.2.0`
- [ ] Lancer les 2 workflows de build (Mac + Windows)

---

## Règles de collaboration importantes

- **Ne jamais modifier le code sans autorisation explicite**
- Expliquer chaque changement en langage simple (le développeur est débutant)
- Toujours tester avec `npm run build` avant de considérer un changement terminé
- Pour lancer l'app en dev : `cd /Users/cedmad/Projets/PictoPlanning-Desktop && npm run dev`
- Garder l'attribution ARASAAC dans tout nouveau code lié à l'impression ou à la bibliothèque

---

## Commandes utiles

```bash
# Lancer en mode développement
cd /Users/cedmad/Projets/PictoPlanning-Desktop && npm run dev

# Vérifier que le build compile
cd /Users/cedmad/Projets/PictoPlanning-Desktop && npm run build

# Voir l'état git
git -C /Users/cedmad/Projets/PictoPlanning-Desktop status

# Voir les fichiers source
find /Users/cedmad/Projets/PictoPlanning-Desktop/src -type f | sort
```
