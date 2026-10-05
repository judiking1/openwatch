import type { WatchConcept } from '../types/watch'
import { orbitalHands } from './orbital-hands'

/** Exhibition order. Add new concepts here. */
export const concepts: WatchConcept[] = [orbitalHands]

export function getConcept(id: string): WatchConcept | undefined {
  return concepts.find((c) => c.metadata.id === id)
}
