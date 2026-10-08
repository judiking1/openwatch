import { Suspense, useMemo, useRef, useState } from 'react'
import { validateSpec, type ConceptSpec } from '../../../scripts/conceptScaffold.mjs'
import { concepts } from '../../watches/registry'
import { WatchStage, type WatchStageHandle } from '../viewer/WatchStage'
import { buildPrompt, nextConceptNumber, parseSpecText } from './prompt'
import { SketchWatch } from './SketchWatch'

type Parsed = { spec: ConceptSpec | null; errors: string[] }

function check(text: string): Parsed {
  if (!text.trim()) return { spec: null, errors: [] }
  try {
    const spec = parseSpecText(text) as ConceptSpec
    const errors = validateSpec(spec)
    const taken = concepts.find((c) => c.metadata.id === spec.id)
    if (taken) errors.push(`id "${spec.id}" is already watch ${taken.metadata.number}`)
    return { spec: errors.length ? null : spec, errors }
  } catch (e) {
    return { spec: null, errors: [e instanceof Error ? e.message : String(e)] }
  }
}

/**
 * Prompt-to-Watch, without a backend: the lab writes the prompt (the kit's own template and
 * schema), the visitor runs it in any LLM and pastes the JSON back, and the spec is validated
 * and sketched live. Downloading the spec hands it to `npm run new-concept`.
 */
export default function ConceptLab() {
  const stage = useRef<WatchStageHandle>(null)
  const [idea, setIdea] = useState('')
  const [copied, setCopied] = useState(false)
  const [text, setText] = useState('')
  const { spec, errors } = useMemo(() => check(text), [text])
  const next = nextConceptNumber(concepts.map((c) => c.metadata.number))

  const copyPrompt = async () => {
    const today = new Date().toISOString().slice(0, 10)
    await navigator.clipboard.writeText(buildPrompt(idea, next, today))
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const download = () => {
    if (!spec) return
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `${spec.id}.spec.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="split-layout">
      <div className="stage">
        <WatchStage ref={stage}>
          <Suspense fallback={null}>{spec && <SketchWatch spec={spec} />}</Suspense>
        </WatchStage>
        {!spec && (
          <div className="drop-hint">
            <p>Your concept appears here</p>
            <p className="note">A sketch of its encoding, running on the current time.</p>
          </div>
        )}
        {spec && (
          <div className="reading-hint" role="note">
            <span className="reading-hint-label">
              Sketch of {spec.number} {spec.name}
            </span>
            {spec.readingHint}
          </div>
        )}
      </div>
      <aside className="panel">
        <section className="panel-section">
          <div className="watch-number">Concept Lab</div>
          <h2 className="panel-title">Prompt to watch</h2>
          <p className="note">
            Describe an idea, copy the prompt into any LLM, paste its JSON answer below. Nothing is
            sent anywhere from this page.
          </p>
        </section>
        <section className="panel-section">
          <h3>1 · Idea</h3>
          <textarea
            className="lab-text"
            rows={3}
            value={idea}
            placeholder="e.g. a watch inspired by tides and the moon"
            onChange={(e) => setIdea(e.target.value)}
          />
          <button onClick={() => void copyPrompt()}>
            {copied ? 'Prompt copied' : `Copy prompt for No. ${next}`}
          </button>
        </section>
        <section className="panel-section">
          <h3>2 · Spec</h3>
          <textarea
            className="lab-text lab-code"
            rows={10}
            value={text}
            placeholder="Paste the JSON spec here"
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          {errors.length > 0 && (
            <ul className="note error lab-errors">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          {spec && (
            <dl className="stats">
              <dt>Watch</dt>
              <dd>
                {spec.number} · {spec.name} — {spec.tagline}
              </dd>
              <dt>Encoding</dt>
              <dd>
                {(['hour', 'minute', 'second'] as const)
                  .filter((u) => spec.encoding[u])
                  .map((u) => `${u}: ${spec.encoding[u]!.element} (${spec.encoding[u]!.variable})`)
                  .join(' · ')}
              </dd>
              <dt>Precedents</dt>
              <dd>{spec.precedents.map((p) => `${p.name} (${p.verdict})`).join(', ')}</dd>
            </dl>
          )}
        </section>
        <section className="panel-section">
          <h3>3 · Build it</h3>
          <button disabled={!spec} onClick={download}>
            Download spec
          </button>
          <p className="note">
            Then in the repository:{' '}
            <code>npm run new-concept -- {spec?.id ?? '<id>'}.spec.json</code>, and replace the
            sketch with the real encoding (docs/concept-generator).
          </p>
        </section>
      </aside>
    </div>
  )
}
