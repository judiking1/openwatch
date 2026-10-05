import { Suspense, useRef, useState } from 'react'
import type { WatchConcept } from '../../types/watch'
import { TimeControls } from '../time/TimeControls'
import { WatchInfo } from './WatchInfo'
import { WatchStage, type WatchStageHandle } from './WatchStage'

type Props = {
  concept: WatchConcept
}

/** Generic exhibition viewer: works for any registered concept. */
export function WatchViewer({ concept }: Props) {
  const stage = useRef<WatchStageHandle>(null)
  const stageBox = useRef<HTMLDivElement>(null)
  const [appearance] = useState(concept.defaultAppearance)
  const { Model, metadata } = concept

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
      </aside>
    </div>
  )
}

export default WatchViewer
