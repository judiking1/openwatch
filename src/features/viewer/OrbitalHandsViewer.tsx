import { useRef } from 'react'
import { TimeControls } from '../time/TimeControls'
import { defaultOrbitalHandsAppearance } from '../../watches/orbital-hands/appearance'
import { orbitalHandsMetadata } from '../../watches/orbital-hands/metadata'
import { OrbitalHandsWatch } from '../../watches/orbital-hands/OrbitalHandsWatch'
import { WatchInfo } from './WatchInfo'
import { WatchStage, type WatchStageHandle } from './WatchStage'

export function OrbitalHandsViewer() {
  const stage = useRef<WatchStageHandle>(null)
  const stageBox = useRef<HTMLDivElement>(null)

  return (
    <div className="split-layout">
      <div className="stage" ref={stageBox}>
        <WatchStage ref={stage}>
          <OrbitalHandsWatch appearance={defaultOrbitalHandsAppearance} />
        </WatchStage>
        <div className="stage-toolbar">
          <button onClick={() => stage.current?.resetCamera()}>Reset view</button>
          <button onClick={() => stageBox.current?.requestFullscreen?.()}>Fullscreen</button>
        </div>
      </div>
      <aside className="panel">
        <WatchInfo meta={orbitalHandsMetadata} />
        <TimeControls />
      </aside>
    </div>
  )
}
