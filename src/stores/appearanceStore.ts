import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Appearance } from '../types/watch'

type AppearanceStore = {
  /** Overrides on top of each concept's default appearance, keyed by concept id. */
  overrides: Record<string, Partial<Appearance>>
  set: (conceptId: string, key: string, value: Appearance[string]) => void
  reset: (conceptId: string) => void
}

export const useAppearanceStore = create<AppearanceStore>()(
  persist(
    (set) => ({
      overrides: {},
      set: (conceptId, key, value) =>
        set(({ overrides }) => ({
          overrides: { ...overrides, [conceptId]: { ...overrides[conceptId], [key]: value } },
        })),
      reset: (conceptId) =>
        set(({ overrides }) => {
          const next = { ...overrides }
          delete next[conceptId]
          return { overrides: next }
        }),
    }),
    {
      name: 'owl-appearance',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export function resolveAppearance(
  defaults: Appearance,
  overrides: Partial<Appearance> | undefined,
): Appearance {
  if (!overrides) return defaults
  const result: Appearance = { ...defaults }
  // Ignore stale keys a concept no longer declares.
  for (const [k, v] of Object.entries(overrides)) {
    if (k in defaults && v !== undefined && typeof v === typeof defaults[k]) result[k] = v
  }
  return result
}
