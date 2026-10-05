import type { ComponentType } from 'react'

export type ConceptOrigin = {
  type: 'human' | 'ai' | 'collaborative'
  note?: string
}

export type Feasibility = 'unknown' | 'conceptual' | 'plausible' | 'prototype-tested'

/** Descriptive metadata for an exhibited watch concept (see PROJECT_VISION.md §9). */
export type WatchMetadata = {
  id: string
  number: string
  name: string
  tagline: string
  description: string
  howToRead: string[]
  experimental: string
  category: string
  createdAt: string
  origin: ConceptOrigin
  timeDisplay: { hour: boolean; minute: boolean; second: boolean }
  feasibility: Feasibility
}

/** Flat bag of visual parameters a concept exposes (colours, numbers, enum strings). */
export type Appearance = Record<string, string | number | boolean>

export type WatchModelProps<A> = {
  appearance: A
}

/**
 * Everything the generic viewer needs to exhibit a concept. Concept-specific
 * logic lives in the concept folder; the viewer only talks to this shape.
 */
export type WatchConcept<A extends object = Appearance> = {
  metadata: WatchMetadata
  defaultAppearance: A
  /** The parameters this concept declares safe to customise. */
  customization: CustomizationField<A>[]
  Model: ComponentType<WatchModelProps<A>>
}

export type CustomizationGroup = 'Case' | 'Dial' | 'Indicators' | 'Crystal' | 'Strap'

export type CustomizationControl =
  | { type: 'color' }
  | { type: 'range'; min: number; max: number; step: number }
  | { type: 'select'; options: Array<{ value: string; label: string }> }

export type CustomizationField<A extends object = Appearance> = {
  key: keyof A & string
  label: string
  group: CustomizationGroup
  control: CustomizationControl
}

/** Helper that keeps the concept fully typed at definition site and erases it for the registry. */
export function defineConcept<A extends object>(concept: WatchConcept<A>): WatchConcept {
  return concept as unknown as WatchConcept
}
