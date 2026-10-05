import { Suspense, useRef } from 'react'
import { resolveAppearance, useAppearanceStore } from '../../stores/appearanceStore'
import type { WatchConcept } from '../../types/watch'
import { CustomizationPanel } from '../customization/CustomizationPanel'
import { TimeControls } from '../time/TimeControls'
import { WatchInfo } from './WatchInfo'
import { WatchStage, type WatchStageHandle } from './WatchStage'

type Props = {
  concept: WatchConcept
  /** Render only the 3D stage (used for thumbnails / embeds). */
  bare?: boolean
}

/** Generic exhibition viewer: works for any registered concept. */
export function WatchViewer({ concept, bare = false }: Props) {
  const stage = useRef<WatchStageHandle>(null)
  const stageBox = useRef<HTMLDivElement>(null)
  const { Model, metadata } = concept
  const overrides = useAppearanceStore((s) => s.overrides[metadata.id])
  const appearance = resolveAppearance(concept.defaultAppearance, overrides)

  if (bare) {
    return (
      <div className="stage stage-bare">
        <WatchStage>
          <Suspense fallback={null}>
            <Model appearance={appearance} />
          </Suspense>
        </WatchStage>
      </div>
    )
  }

  return (
    <div className="split-layout">
      <div className="stage" ref={stageBox}>
        <WatchStage ref={stage}>
          <Suspense fallback={null}>
            <Model appearance={appearance} />
          </Suspense>
        </WatchStage>
        <div className="stage-toolbar">
          <button onClick={() => stage.current?.resetCamera()}>Reset view</button>
          <button onClick={() => stageBox.current?.requestFullscreen?.()}>Fullscreen</button>
        </div>
      </div>
      <aside className="panel">
        <WatchInfo meta={metadata} />
        <TimeControls />
        <CustomizationPanel
          fields={concept.customization}
          appearance={appearance}
          onChange={(key, value) => useAppearanceStore.getState().set(metadata.id, key, value)}
          onReset={() => useAppearanceStore.getState().reset(metadata.id)}
        />
      </aside>
    </div>
  )
}

export default WatchViewer
