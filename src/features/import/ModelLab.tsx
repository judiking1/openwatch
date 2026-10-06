import { useEffect, useRef, useState, type DragEvent } from 'react'
import { Quaternion, Vector3, type Object3D } from 'three'
import { useClockFrame } from '../../three/hooks'
import { DIAL_RADIUS } from '../../three/utils/dial'
import { degToRad, handAngles } from '../../utils/time'
import { TimeControls } from '../time/TimeControls'
import { WatchStage, type WatchStageHandle } from '../viewer/WatchStage'
import { HAND_NAMES, loadGlb, type HandName, type LoadedModel } from './loadGlb'

type UpAxis = 'z' | 'y'

const AXES: Record<UpAxis, Vector3> = { z: new Vector3(0, 0, 1), y: new Vector3(0, 1, 0) }

function disposeScene(root: Object3D) {
  root.traverse((node) => {
    const mesh = node as Object3D & {
      geometry?: { dispose(): void }
      material?: { dispose(): void } | Array<{ dispose(): void }>
    }
    mesh.geometry?.dispose()
    for (const m of Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : []) {
      m.dispose()
    }
  })
}

/**
 * Shows an imported model in dial units: centred, scaled so its width matches a watch case
 * (≈ 2.3 × dial radius) and turned so its up axis faces the viewer.
 */
function ImportedModel({
  model,
  up,
  animate,
}: {
  model: LoadedModel
  up: UpAxis
  animate: boolean
}) {
  const base = useRef(new Map<HandName, Quaternion>())
  const spin = useRef(new Quaternion())

  useEffect(() => {
    const map = base.current
    const saved = new Map<HandName, Quaternion>()
    map.clear()
    // This app's exports freeze the hands at the export time; their rest pose is 12 o'clock.
    const fromThisApp = typeof model.extras.concept === 'string'
    for (const name of HAND_NAMES) {
      const node = model.hands[name]
      if (!node) continue
      saved.set(name, node.quaternion.clone())
      map.set(name, fromThisApp ? new Quaternion() : node.quaternion.clone())
    }
    return () => {
      // Restore the file's own pose when animation stops or the model changes.
      for (const [name, q] of saved) model.hands[name]?.quaternion.copy(q)
    }
  }, [model, animate])

  useClockFrame((t) => {
    if (!animate) return
    const a = handAngles(t)
    for (const name of HAND_NAMES) {
      const node = model.hands[name]
      const rest = base.current.get(name)
      if (!node || !rest) continue
      // Clockwise seen from the dial side = negative rotation about the up axis.
      spin.current.setFromAxisAngle(AXES[up], -degToRad(a[name]))
      node.quaternion.copy(rest).multiply(spin.current)
    }
  })

  // Fit the width (x): straps make the other horizontal axis much longer than the case.
  const scale = (DIAL_RADIUS * 2.3) / Math.max(model.size.x, 1e-6)
  const centre = model.centre

  return (
    <group rotation={[up === 'y' ? Math.PI / 2 : 0, 0, 0]} scale={scale}>
      <group position={[-centre.x, -centre.y, -centre.z]}>
        <primitive object={model.scene} />
      </group>
    </group>
  )
}

/** Drop a .glb to inspect it; parts named hour / minute / second are driven by the clock. */
export function ModelLab() {
  const stage = useRef<WatchStageHandle>(null)
  const [model, setModel] = useState<LoadedModel | null>(null)
  const [file, setFile] = useState<{ name: string; size: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [up, setUp] = useState<UpAxis>('z')
  const [animate, setAnimate] = useState(true)

  useEffect(() => () => void (model && disposeScene(model.scene)), [model])

  async function open(f: File) {
    setError(null)
    if (!/\.glb$/i.test(f.name)) {
      setError('Please choose a binary glTF (.glb) file.')
      return
    }
    try {
      const loaded = await loadGlb(await f.arrayBuffer())
      setModel(loaded)
      setFile({ name: f.name, size: f.size })
      // Our own exports carry their concept metadata and are authored with +Z up.
      setUp(loaded.extras.concept ? 'z' : 'y')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) void open(f)
  }

  const extras = model?.extras ?? {}

  return (
    <div className="split-layout">
      <div
        className={`stage ${dragging ? 'stage-drop' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <WatchStage ref={stage}>
          {model && <ImportedModel model={model} up={up} animate={animate} />}
        </WatchStage>
        {!model && (
          <div className="drop-hint">
            <p>Drop a .glb here</p>
            <p className="note">
              Try a file from “Download GLB” on any watch, or a model from Blender with parts named
              hour / minute / second.
            </p>
          </div>
        )}
        <div className="stage-toolbar">
          <button onClick={() => stage.current?.resetCamera()}>Front view</button>
        </div>
      </div>
      <aside className="panel">
        <section className="panel-section">
          <div className="watch-number">Model Lab</div>
          <h2 className="panel-title">Import GLB</h2>
          <label className="file-button">
            <input
              type="file"
              accept=".glb,model/gltf-binary"
              onChange={(e) => e.target.files?.[0] && void open(e.target.files[0])}
            />
            Choose file…
          </label>
          {error && <p className="note error">{error}</p>}
          {file && model && (
            <dl className="stats">
              <dt>File</dt>
              <dd>
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </dd>
              <dt>Nodes / meshes</dt>
              <dd>
                {model.stats.nodes} / {model.stats.meshes}
              </dd>
              <dt>Materials</dt>
              <dd>{model.stats.materials}</dd>
              <dt>Size</dt>
              <dd>
                {[model.size.x, model.size.y, model.size.z]
                  .map((v) => (v < 1 ? `${(v * 1000).toFixed(1)} mm` : v.toFixed(2)))
                  .join(' × ')}
              </dd>
              <dt>Triangles</dt>
              <dd>{model.stats.triangles.toLocaleString()}</dd>
              {typeof extras.name === 'string' && (
                <>
                  <dt>Exhibit</dt>
                  <dd>
                    {extras.name}
                    {typeof extras.appVersion === 'string' &&
                      ` · exported by v${extras.appVersion}`}
                  </dd>
                </>
              )}
            </dl>
          )}
          {typeof extras.disclaimer === 'string' && <p className="note">{extras.disclaimer}</p>}
        </section>

        {model && (
          <section className="panel-section">
            <h3>Clock-driven parts</h3>
            <ul className="hand-list">
              {HAND_NAMES.map((name) => (
                <li key={name} className={model.hands[name] ? 'found' : ''}>
                  {model.hands[name] ? '●' : '○'} {name}
                  {model.hands[name] && (
                    <span className="note"> — “{model.hands[name]!.name}”</span>
                  )}
                </li>
              ))}
            </ul>
            <label className="field checkbox">
              <input
                type="checkbox"
                checked={animate}
                onChange={(e) => setAnimate(e.target.checked)}
              />
              <span>Drive them with the clock</span>
            </label>
            <label className="field">
              <span>Model up axis (dial faces)</span>
              <select value={up} onChange={(e) => setUp(e.target.value as UpAxis)}>
                <option value="z">+Z — this app’s exports</option>
                <option value="y">+Y — Blender / most tools</option>
              </select>
            </label>
            <p className="note">
              Parts rotate clockwise about the up axis from the pose saved in the file, so model
              hands pointing at 12 with their pivot at the dial centre.
            </p>
          </section>
        )}
        <TimeControls />
      </aside>
    </div>
  )
}

export default ModelLab
