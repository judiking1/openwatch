import { create } from 'zustand'
import {
  createLiveModel,
  goLive,
  resolveTime,
  setManualTime,
  setPaused,
  setSpeed,
  type TimeModel,
} from '../features/time/timeModel'

type TimeStore = {
  model: TimeModel
  now: () => number
  goLive: () => void
  setSpeed: (speed: number) => void
  setPaused: (paused: boolean) => void
  setManualTime: (simMs: number) => void
}

export const useTimeStore = create<TimeStore>((set, get) => ({
  model: createLiveModel(Date.now()),
  now: () => resolveTime(get().model, Date.now()),
  goLive: () => set({ model: goLive(Date.now()) }),
  setSpeed: (speed) => set(({ model }) => ({ model: setSpeed(model, Date.now(), speed) })),
  setPaused: (paused) => set(({ model }) => ({ model: setPaused(model, Date.now(), paused) })),
  setManualTime: (simMs) =>
    set(({ model }) => ({ model: setManualTime(model, Date.now(), simMs) })),
}))
