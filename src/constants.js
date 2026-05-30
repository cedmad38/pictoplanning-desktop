export const ARASAAC_SEARCH = q =>
  `https://api.arasaac.org/api/pictograms/fr/search/${encodeURIComponent(q)}`
export const ARASAAC_IMG = id =>
  `https://static.arasaac.org/pictograms/${id}/${id}_500.png`

export const QUICK_CATS = [
  { label:'🌅 Matin',     terms:['réveil','douche','habillage','dents','école'] },
  { label:'🍽 Repas',     terms:['manger','déjeuner','boire','fruits','goûter'] },
  { label:'🎨 Activités', terms:['jeu','dessin','sport','musique','lecture'] },
  { label:'🌙 Soirée',    terms:['pyjama','bain','dodo','histoire','nuit'] },
  { label:'😊 Émotions',  terms:['content','triste','colère','peur','calme'] },
  { label:'🏠 Lieux',     terms:['maison','école','médecin','voiture','magasin'] },
  { label:'🧼 Hygiène',   terms:['savon','brosse','toilette','peigne','serviette'] },
  { label:'📅 Temps',     terms:['matin','après-midi','soir','lundi','attendre'] },
]

export const PALETTE = [
  '#FFF9F0','#E1F5EE','#E6F1FB','#FAEEDA',
  '#FBEAF0','#EAF3DE','#FAECE7','#F1EFE8',
  '#EDE7F6','#E8F5E9','#FFF8E1','#E3F2FD',
]

export const PAL_NAMES = [
  'Blanc chaud','Menthe','Bleu ciel','Pêche',
  'Rose','Vert tendre','Corail','Gris doux',
  'Lilas','Sauge','Miel','Azur',
]

export const STORAGE_KEY = 'pictoplanning_autosave'
export const CM = 37.795
export const isElectron = typeof window !== 'undefined' && !!window.electronAPI
