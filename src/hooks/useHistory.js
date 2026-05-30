import { useState, useCallback } from 'react'

export function useHistory(initial) {
  const [s, set] = useState({ past:[], now:initial, future:[] })

  const push = useCallback(next => {
    set(({ past, now }) => ({
      past:    [...past.slice(-40), now],
      now:     typeof next === 'function' ? next(now) : next,
      future:  [],
    }))
  }, [])

  const undo = useCallback(() => {
    set(({ past, now, future }) => {
      if (!past.length) return { past, now, future }
      return {
        past:   past.slice(0, -1),
        now:    past[past.length - 1],
        future: [now, ...future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    set(({ past, now, future }) => {
      if (!future.length) return { past, now, future }
      return {
        past:   [...past, now],
        now:    future[0],
        future: future.slice(1),
      }
    })
  }, [])

  return {
    grids:    s.now,
    setGrids: push,
    undo,
    redo,
    canUndo:  s.past.length > 0,
    canRedo:  s.future.length > 0,
  }
}
