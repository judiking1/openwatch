import promptDoc from '../../../docs/concept-generator/prompt.md?raw'
import schema from '../../../docs/concept-generator/concept-spec.schema.json?raw'

/** The prompt block of docs/concept-generator/prompt.md (one source for the kit and the lab). */
export function promptTemplate(doc = promptDoc) {
  const match = /```text\n([\s\S]*?)```/.exec(doc)
  return match ? match[1].trim() : ''
}

/** Fills the template: the visitor's idea, the schema, the next free number and today. */
export function buildPrompt(idea: string, nextNumber: string, today: string, doc = promptDoc) {
  return promptTemplate(doc)
    .replace(/\{IDEA[^}]*\}/, idea.trim() || 'surprise me')
    .replace(/\{PASTE concept-spec\.schema\.json\}/, `\n${schema}`)
    .replace(/\{e\.g\. \d{3}\}/, nextNumber)
    .replace('{YYYY-MM-DD}', today)
}

/** The number after the highest one in the exhibition, three digits. */
export function nextConceptNumber(numbers: string[]) {
  const highest = Math.max(0, ...numbers.map(Number).filter(Number.isFinite))
  return String(highest + 1).padStart(3, '0')
}

/** Parses pasted LLM output: tolerates a ```json fence and text around the object. */
export function parseSpecText(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('No JSON object found.')
  return JSON.parse(body.slice(start, end + 1))
}
