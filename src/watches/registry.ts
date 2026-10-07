import type { WatchConcept } from '../types/watch'
import { angbuilgu } from './angbuilgu'
import { chladni } from './chladni'
import { cipher } from './cipher'
import { eclipse } from './eclipse'
import { iris } from './iris'
import { jagyeongnu } from './jagyeongnu'
import { lens } from './lens'
import { marble } from './marble'
import { numeralRing } from './numeral-ring'
import { opticalLever } from './optical-lever'
import { orbitalHands } from './orbital-hands'
import { shears } from './shears'
import { turntable } from './turntable'

/** Exhibition order. Add new concepts here. */
export const concepts: WatchConcept[] = [
  orbitalHands,
  numeralRing,
  eclipse,
  shears,
  turntable,
  cipher,
  marble,
  lens,
  opticalLever,
  angbuilgu,
  jagyeongnu,
  iris,
  chladni,
]

export function getConcept(id: string): WatchConcept | undefined {
  return concepts.find((c) => c.metadata.id === id)
}
