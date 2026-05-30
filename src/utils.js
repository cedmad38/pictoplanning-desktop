import { PALETTE } from './constants'

let _id = 0
export const nid  = () => String(++_id)
export const rndC = () => PALETTE[Math.floor(Math.random() * PALETTE.length)]

export const mkArasaac = (id, label) => ({ uid:nid(), arasaacId:id, label, color:rndC() })
export const mkEmoji   = (e, l, col) => ({ uid:nid(), emoji:e, label:l, color:col||rndC() })
export const mkPhoto   = (data, label) => ({ uid:nid(), imageData:data, label:label||'Photo', color:rndC() })

export const localFileUrl = filePath => {
  const n = filePath.replace(/\\/g, '/')
  return `local-file://${n.startsWith('/') ? '' : '/'}${n}`
}

export const squareCrop = dataUrl => new Promise(res => {
  const img = new Image()
  img.onload = () => {
    const s = Math.min(img.width, img.height)
    const c = document.createElement('canvas')
    c.width = c.height = s
    c.getContext('2d').drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, s, s)
    res(c.toDataURL('image/jpeg', 0.85))
  }
  img.src = dataUrl
})

export const resizeOnly = (dataUrl, maxSize=900) => new Promise(res => {
  const img = new Image()
  img.onload = () => {
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    c.getContext('2d').drawImage(img, 0, 0, w, h)
    res(c.toDataURL('image/jpeg', 0.85))
  }
  img.src = dataUrl
})

export const initGrid = () => {
  const g = Array.from({ length:5 }, () => [null,null,null])
  const c = (e,l,col) => mkEmoji(e,l,col)
  g[0][0]=c('⏰','Réveil','#FAEEDA');       g[0][1]=c('😊','Content','#FBEAF0')
  g[1][0]=c('🚿','Douche','#E6F1FB');        g[1][1]=c('🦷','Dents','#E1F5EE')
  g[2][0]=c('🥣','Petit-déjeuner','#FFF9F0'); g[2][1]=c('🍊','Fruits','#EAF3DE'); g[2][2]=c('💧','Boire','#E3F2FD')
  g[3][0]=c('👕','Habillage','#FBEAF0')
  g[4][0]=c('🎒','Sac école','#F1EFE8');     g[4][1]=c('🚌','Bus','#E1F5EE')
  return g
}
