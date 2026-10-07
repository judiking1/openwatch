import { create } from 'zustand'

/** Viewer-only presentation state shared by the stage toolbar and the 3D scene. */
type StageStore = {
  /** 0 = assembled, 1 = fully exploded along the watch axis. */
  explode: number
  /** Night view: studio lights off, luminous parts glow. */
  lume: boolean
  /** Procedural watch sounds (off until the visitor turns them on). */
  sound: boolean
  setExplode: (value: number) => void
  setLume: (value: boolean) => void
  setSound: (value: boolean) => void
}

export const useStageStore = create<StageStore>()((set) => ({
  explode: 0,
  lume: false,
  sound: false,
  setExplode: (explode) => set({ explode }),
  setLume: (lume) => set({ lume }),
  setSound: (sound) => set({ sound }),
}))
