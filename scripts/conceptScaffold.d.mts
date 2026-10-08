/** Types for the plain-JS scaffold (shared by the CLI and the in-app concept lab). */
export type EncodingVariable =
  | 'angle'
  | 'relative angle'
  | 'radius'
  | 'size'
  | 'position'
  | 'count'
  | 'alignment'
  | 'colour'
  | 'shape'
  | 'other'

export type UnitEncoding = { element: string; variable: EncodingVariable; note?: string }

export type ConceptSpec = {
  id: string
  number: string
  name: string
  tagline: string
  description: string
  readingHint: string
  howToRead: string[]
  experimental?: string
  encoding: { hour: UnitEncoding; minute: UnitEncoding; second?: UnitEncoding }
  axes: string[]
  precedents: Array<{ name: string; url?: string; verdict: 'different' | 'overlaps' | 'same' }>
  category: string
  origin: { type: 'human' | 'ai' | 'collaborative'; note: string }
  feasibility: 'plausible' | 'conceptual' | 'speculative'
  appearance: Array<{ key: string; label: string; group: 'Dial' | 'Indicators'; default: string }>
  sound?: 'escapement' | 'drop' | 'ratchet' | 'quiet'
}

export function validateSpec(spec: Partial<ConceptSpec>): string[]
export function scaffold(spec: ConceptSpec, today?: string): Record<string, string>
export function register(registrySource: string, id: string): string
