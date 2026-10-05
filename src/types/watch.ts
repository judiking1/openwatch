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
