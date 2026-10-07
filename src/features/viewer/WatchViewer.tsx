import { Suspense, useEffect, useRef } from 'react'
import { resolveAppearance, useAppearanceStore } from '../../stores/appearanceStore'
import type { WatchConcept } from '../../types/watch'
import { CustomizationPanel } from '../customization/CustomizationPanel'
import { ExportSection } from '../export/ExportSection'
import { TimeControls } from '../time/TimeControls'
import { WatchHeader, WatchStory } from './WatchInfo'
import type { RendererMode } from './rendererMode'
import type { ToneMappingName } from './toneMapping'
import { WatchStage, type WatchStageHandle } from './WatchStage'
import { useStageStore } from '../../stores/stageStore'

type Props = {
  concept: WatchConcept
  /** Neighbours in exhibition order, for previous / next navigation. */
  prev?: WatchConcept
  next?: WatchConcept
  /** Render only the 3D stage (used for thumbnails / embeds). */
  bare?: boolean
  /** Show renderer statistics on the stage (`?stats`). */
  stats?: boolean
  /** Tone mapping override for look development (`?tone=agx`). */
  tone?: ToneMappingName
  /** Renderer override (`?renderer=webgpu`). */
  renderer?: RendererMode
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)
}

function updateQueryParam(key: string, value: string | null) {
  const hash = window.location.hash.replace(/^#/, '') || '/'
  const [path, query = ''] = hash.split('?')
  const params = new URLSearchParams(query)
  if (value === null) {
    params.delete(key)
  } else {
    params.set(key, value)
  }
  const q = params.toString()
  window.location.hash = q ? `${path}?${q}` : path
}

/** ←/→ walk through the exhibition. */
function useArrowNavigation(prev?: WatchConcept, next?: WatchConcept) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.key === 'ArrowLeft' ? prev : e.key === 'ArrowRight' ? next : undefined
      if (target) window.location.hash = `#/watch/${target.metadata.id}`
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])
}

/** Generic exhibition viewer: works for any registered concept. */
export function WatchViewer({
  concept,
  prev,
  next,
  bare = false,
  stats = false,
  tone,
  renderer,
}: Props) {
  const stage = useRef<WatchStageHandle>(null)
  const stageBox = useRef<HTMLDivElement>(null)
  const { Model, metadata } = concept
  const overrides = useAppearanceStore((s) => s.overrides[metadata.id])
  const appearance = resolveAppearance(concept.defaultAppearance, overrides)
  useArrowNavigation(prev, next)
  const explode = useStageStore((s) => s.explode)
  const setExplode = useStageStore((s) => s.setExplode)
  const lume = useStageStore((s) => s.lume)
  const setLume = useStageStore((s) => s.setLume)
  // Presentation modes belong to the viewer visit: reset them when leaving.
  useEffect(
    () => () => {
      setExplode(0)
      setLume(false)
    },
    [setExplode, setLume],
  )

  const model = (
    <WatchStage
      ref={stage}
      stats={stats}
      toneMapping={tone}
      renderer={renderer}
      postFx={concept.postFx}
    >
      <Suspense fallback={null}>
        <Model appearance={appearance} />
      </Suspense>
    </WatchStage>
  )

  if (bare) return <div className="stage stage-bare">{model}</div>

  return (
    <div className="split-layout">
      <div className="stage" ref={stageBox}>
        {model}
        <div className="reading-hint" role="note">
          <span className="reading-hint-label">How to read</span>
          {metadata.readingHint}
        </div>
        <div className="stage-toolbar">
          <button onClick={() => stage.current?.resetCamera()}>Front view</button>
          <button onClick={() => stageBox.current?.requestFullscreen?.()}>Fullscreen</button>
          <button
            onClick={() => updateQueryParam('renderer', renderer === 'webgpu' ? null : 'webgpu')}
            title="Toggle experimental WebGPURenderer"
            aria-pressed={renderer === 'webgpu'}
          >
            {renderer === 'webgpu' ? '⚡ WebGPU' : 'WebGL'}
          </button>
          <label className="toolbar-range" title="Pull the layers apart along the watch axis">
            Explode
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explode}
              onChange={(e) => setExplode(Number(e.target.value))}
              aria-label="Exploded view"
            />
          </label>
          <button
            onClick={() => setLume(!lume)}
            title="Night view: studio lights off, luminous prints and hands glow"
            aria-pressed={lume}
          >
            🌙 Lume
          </button>
          <button
            onClick={() => updateQueryParam('stats', stats ? null : '')}
            title="Toggle render statistics probe"
            aria-pressed={stats}
          >
            Stats
          </button>
        </div>
        <nav className="stage-nav" aria-label="Exhibition">
          {prev && (
            <a href={`#/watch/${prev.metadata.id}`} title="Previous (←)">
              ← {prev.metadata.number}
            </a>
          )}
          {next && (
            <a href={`#/watch/${next.metadata.id}`} title="Next (→)">
              {next.metadata.number} →
            </a>
          )}
        </nav>
      </div>
      <aside className="panel">
        <WatchHeader meta={metadata} />
        <TimeControls />
        <WatchStory meta={metadata} />
        <CustomizationPanel
          fields={concept.customization}
          appearance={appearance}
          onChange={(key, value) => useAppearanceStore.getState().set(metadata.id, key, value)}
          onReset={() => useAppearanceStore.getState().reset(metadata.id)}
        />
        <ExportSection
          meta={metadata}
          appearance={appearance}
          getRoot={() => stage.current?.getModelRoot()}
        />
      </aside>
    </div>
  )
}

export default WatchViewer
