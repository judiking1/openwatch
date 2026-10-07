/**
 * Turns a concept spec (docs/concept-generator/concept-spec.schema.json) into the files of a
 * new concept. Pure: returns { path: content } and changes nothing on disk.
 */

const REQUIRED = [
  'id',
  'number',
  'name',
  'tagline',
  'description',
  'readingHint',
  'howToRead',
  'encoding',
  'axes',
  'precedents',
  'category',
  'origin',
  'feasibility',
  'appearance',
]

/** Light validation of what the scaffold relies on (the JSON schema documents the rest). */
export function validateSpec(spec) {
  const errors = []
  for (const key of REQUIRED) if (spec[key] === undefined) errors.push(`missing "${key}"`)
  if (spec.id && !/^[a-z][a-z0-9-]*$/.test(spec.id)) errors.push('"id" must be kebab-case')
  if (spec.number && !/^\d{3}$/.test(spec.number)) errors.push('"number" must be three digits')
  if (spec.readingHint && spec.readingHint.length > 110)
    errors.push('"readingHint" is longer than one line')
  if (Array.isArray(spec.precedents) && spec.precedents.some((p) => p.verdict === 'same'))
    errors.push('a precedent is marked "same": the concept already exists')
  for (const field of spec.appearance ?? []) {
    if (!/^#[0-9a-fA-F]{6}$/.test(field.default ?? ''))
      errors.push(`appearance "${field.key}" needs a #rrggbb default`)
  }
  if (!spec.encoding?.hour || !spec.encoding?.minute)
    errors.push('"encoding" needs hour and minute')
  return errors
}

const pascal = (id) =>
  id
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
const camel = (id) => pascal(id)[0].toLowerCase() + pascal(id).slice(1)
const str = (s) => JSON.stringify(s)

export function scaffold(spec, today = new Date().toISOString().slice(0, 10)) {
  const errors = validateSpec(spec)
  if (errors.length) throw new Error(`Invalid concept spec:\n- ${errors.join('\n- ')}`)
  const { id } = spec
  const Name = pascal(id)
  const name = camel(id)
  const dir = `src/watches/${id}`
  const fields = spec.appearance
  const hasSecond = Boolean(spec.encoding.second)

  const metadata = `import type { WatchMetadata } from '../../types/watch'

export const ${name}Metadata: WatchMetadata = {
  id: ${str(id)},
  number: ${str(spec.number)},
  name: ${str(spec.name)},
  tagline: ${str(spec.tagline)},
  description: ${str(spec.description)},
  readingHint: ${str(spec.readingHint)},
  howToRead: ${JSON.stringify(spec.howToRead, null, 2).replace(/\n/g, '\n  ')},
  experimental: ${str(spec.experimental ?? '')},
  category: ${str(spec.category)},
  createdAt: ${str(today)},
  origin: { type: ${str(spec.origin.type)}, note: ${str(spec.origin.note)} },
  timeDisplay: { hour: true, minute: true, second: ${hasSecond} },
  feasibility: ${str(spec.feasibility)},
}
`

  const appearance = `import { caseFields } from '../../three/parts/fields'
import type { CrystalAppearance } from '../../three/parts/Crystal'
import type { CaseAppearance } from '../../three/parts/WatchCase'
import type { CustomizationField } from '../../types/watch'

export type ${Name}Appearance = CaseAppearance &
  CrystalAppearance & {
${fields.map((f) => `    ${f.key}: string`).join('\n')}
  }

export const default${Name}Appearance: ${Name}Appearance = {
  caseColor: '#c8cad0',
  caseRoughness: 0.25,
  strapColor: '#2a2420',
  strapStyle: 'leather',
  crystalTint: '#e6eef5',
  crystalOpacity: 0.1,
${fields.map((f) => `  ${f.key}: ${str(f.default.toLowerCase())},`).join('\n')}
}

export const ${name}Fields: CustomizationField<${Name}Appearance>[] = [
  ...caseFields,
${fields.map((f) => `  { key: ${str(f.key)}, label: ${str(f.label)}, group: ${str(f.group)}, control: { type: 'color' } },`).join('\n')}
]
`

  const soundLine = {
    escapement: '',
    drop: "\n  sound: { kind: 'drop', offset: 0.5 },",
    ratchet: "\n  sound: { kind: 'ratchet' },",
    quiet: "\n  sound: { kind: 'quiet' },",
  }[spec.sound ?? 'escapement']

  const index = `import { lazy } from 'react'
import { defineConcept } from '../../types/watch'
import { default${Name}Appearance, ${name}Fields } from './appearance'
import { ${name}Metadata } from './metadata'

export const ${name} = defineConcept({
  metadata: ${name}Metadata,
  defaultAppearance: default${Name}Appearance,
  customization: ${name}Fields,
  Model: lazy(() => import('./${Name}Watch').then((m) => ({ default: m.${Name}Watch }))),${soundLine}
})
`

  const math = `import { handAngles, type ClockTime } from '../../utils/time'

/**
 * Time → geometry for ${spec.name}. Starts as plain hand angles; replace with the concept's
 * own encoding:
${['hour', 'minute', 'second']
  .filter((u) => spec.encoding[u])
  .map((u) => ` * - ${u}: ${spec.encoding[u].element} (${spec.encoding[u].variable})`)
  .join('\n')}
 */
export function ${name}Pose(t: ClockTime) {
  return handAngles(t)
}
`

  const test = `import { describe, expect, it } from 'vitest'
import { ${name}Pose } from './${id}'

describe('${id}', () => {
  it('shows 3:00 with the hour a quarter turn round', () => {
    expect(${name}Pose({ hours: 3, minutes: 0, seconds: 0, milliseconds: 0 }).hour).toBeCloseTo(90)
  })
})
`

  const firstIndicator = fields.find((f) => f.group === 'Indicators')?.key
  const firstDial = fields.find((f) => f.group === 'Dial')?.key
  const model = `import { useRef } from 'react'
import type { Group } from 'three'
import { useClockFrame, useDialTexture } from '../../three/hooks'
import { Crystal } from '../../three/parts/Crystal'
import { PrintLayer } from '../../three/parts/PrintLayer'
import { WatchCase } from '../../three/parts/WatchCase'
import { dialFont, drawLabels, HOUR_LABELS } from '../../three/utils/canvas'
import { DIAL_RADIUS, dialRotationZ } from '../../three/utils/dial'
import type { ${Name}Appearance } from './appearance'
import { ${name}Pose } from './${id}'

function drawDial(ctx: CanvasRenderingContext2D) {
  drawLabels(ctx, HOUR_LABELS, { radius: 86, font: dialFont(700, 8), color: '#ffffff' })
}

/** Watch ${spec.number} — ${spec.name}. Scaffolded placeholder: replace the hands with the concept. */
export function ${Name}Watch({ appearance }: { appearance: ${Name}Appearance }) {
  const hour = useRef<Group>(null)
  const minute = useRef<Group>(null)
  const second = useRef<Group>(null)
  const dial = useDialTexture(DIAL_RADIUS, drawDial, [])

  useClockFrame((t) => {
    const pose = ${name}Pose(t)
    if (hour.current) hour.current.rotation.z = dialRotationZ(pose.hour)
    if (minute.current) minute.current.rotation.z = dialRotationZ(pose.minute)
    if (second.current) second.current.rotation.z = dialRotationZ(pose.second)
  })

  const indicator = ${firstIndicator ? `appearance.${firstIndicator}` : "'#222222'"}
  return (
    <WatchCase {...appearance}>
      <mesh>
        <circleGeometry args={[DIAL_RADIUS + 1, 128]} />
        <meshStandardMaterial color={${firstDial ? `appearance.${firstDial}` : "'#e9e5dc'"}} roughness={0.7} />
      </mesh>
      <PrintLayer mask={dial} color={indicator} radius={DIAL_RADIUS} />
      {(
        [
          [hour, 50, 4],
          [minute, 74, 2.6],${hasSecond ? '\n          [second, 80, 1],' : ''}
        ] as const
      ).map(([ref, length, width], i) => (
        <group key={i} ref={ref} name={['hour', 'minute', 'second'][i]}>
          <mesh position={[0, length / 2, 2 + i]}>
            <boxGeometry args={[width, length, 1]} />
            <meshStandardMaterial color={indicator} />
          </mesh>
        </group>
      ))}
      <Crystal {...appearance} />
    </WatchCase>
  )
}
`

  const doc = `# Watch ${spec.number} — ${spec.name}

- **Origin:** ${spec.origin.type} — ${spec.origin.note}
- **Feasibility:** ${spec.feasibility}

## Core idea

${spec.description}

## How to read it

${spec.howToRead.map((line) => `- ${line}`).join('\n')}

## Encoding

| Unit | Element | Variable |
| ---- | ------- | -------- |
${['hour', 'minute', 'second']
  .filter((u) => spec.encoding[u])
  .map((u) => `| ${u} | ${spec.encoding[u].element} | ${spec.encoding[u].variable} |`)
  .join('\n')}

Difference axes: ${spec.axes.join('; ')}.

## Precedents

| Reference | Verdict |
| --------- | ------- |
${spec.precedents.map((p) => `| ${p.url ? `[${p.name}](${p.url})` : p.name} | ${p.verdict} |`).join('\n')}
`

  return {
    [`${dir}/metadata.ts`]: metadata,
    [`${dir}/appearance.ts`]: appearance,
    [`${dir}/index.ts`]: index,
    [`${dir}/${id}.ts`]: math,
    [`${dir}/${id}.test.ts`]: test,
    [`${dir}/${Name}Watch.tsx`]: model,
    [`docs/concepts/${id}.md`]: doc,
  }
}

/** Adds the import and the exhibition entry to src/watches/registry.ts. */
export function register(registrySource, id) {
  const name = camel(id)
  if (registrySource.includes(`from './${id}'`)) return registrySource
  const withImport = registrySource.replace(
    "import type { WatchConcept } from '../types/watch'\n",
    `import type { WatchConcept } from '../types/watch'\nimport { ${name} } from './${id}'\n`,
  )
  return withImport.replace(/\n\]\n/, `\n  ${name},\n]\n`)
}
