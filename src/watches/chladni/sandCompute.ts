import {
  IcosahedronGeometry,
  Mesh,
  InstancedMesh,
  MeshStandardNodeMaterial,
  Vector2,
  type ComputeNode,
  type WebGPURenderer,
} from 'three/webgpu'
import {
  atomicAdd,
  atomicLoad,
  atomicStore,
  clamp,
  float,
  floor,
  Fn,
  hash,
  If,
  instancedArray,
  instanceIndex,
  int,
  max,
  min,
  positionLocal,
  Return,
  select,
  sqrt,
  storage,
  transformNormalToView,
  uint,
  uniform,
  varying,
  vec2,
  vec3,
  vertexIndex,
} from 'three/tsl'
import { createHeightfieldGeometry, onPlate, SAND_BASE_Z } from './heightfield'
import {
  CELL,
  DRIFT,
  GAIN,
  GRID,
  KICK,
  PILE,
  REPOSE,
  PLATE_RADIUS,
  SAND_VOLUME,
  SLIDE,
  SOFT,
  type PlatePose,
} from './sand'
import { loose as n } from '../../three/utils/tsl'

/** Grains one contact cell can hold (a cell is one grain diameter wide, so about four fit). */
const SLOTS = 6

/**
 * Chladni sand on the WebGPU backend: grains live in a storage buffer, a compute kernel
 * advances them with exactly the CPU model of `sand.ts` (energy slope, kicks, tilt slide,
 * reflection at the rim), and the instanced grains read their positions from the same buffer
 * in the vertex shader — no copies back to the CPU.
 *
 * Piling runs on the GPU too: grains are counted into the height grid with atomics, the
 * counts are blurred into heights, grains slide down the height slope, and a heightfield
 * mesh reads the same heights (and its normals from their differences) in its vertex shader.
 */
export function createComputeSand(initial: Float32Array, z: number, grainSize: number) {
  const count = initial.length / 2
  const grains = instancedArray(initial, 'vec2')
  const u = {
    dir: uniform(new Vector2(0, 1)),
    ring: uniform(40),
    dt: uniform(1 / 60),
    kick: uniform(0),
    tilt: uniform(new Vector2(0, 0)),
    seed: uniform(0),
  }

  const cells = GRID * GRID
  const counts = instancedArray(cells, 'uint').toAtomic()
  const heights = instancedArray(cells, 'float')
  const cellOf = (v: unknown) => int(clamp(floor(n(v).add(PLATE_RADIUS).div(CELL)), 0, GRID - 1))
  const perCell = (body: () => void) =>
    Fn(() => {
      If(instanceIndex.greaterThanEqual(cells), () => {
        Return()
      })
      body()
    })().compute(cells, [64])

  const clear = perCell(() => {
    atomicStore(counts.element(instanceIndex), uint(0))
  })
  const deposit: ComputeNode = Fn(() => {
    If(instanceIndex.greaterThanEqual(count), () => {
      Return()
    })
    const grain = n(grains.element(instanceIndex))
    atomicAdd(counts.element(cellOf(grain.y).mul(GRID).add(cellOf(grain.x))), uint(1))
  })().compute(count, [64])
  // Same 3×3 blur as the CPU model (weights 1-2-1), edges clamped.
  const perGrain = SAND_VOLUME / count / (CELL * CELL)
  const blur = perCell(() => {
    const i = int(instanceIndex)
    const x = i.mod(GRID)
    const y = i.div(GRID)
    const sum = float(0).toVar()
    for (const dy of [-1, 0, 1]) {
      for (const dx of [-1, 0, 1]) {
        const xx = n(clamp(n(x.add(dx)), 0, GRID - 1))
        const yy = n(clamp(n(y.add(dy)), 0, GRID - 1))
        const c = float(atomicLoad(counts.element(yy.mul(GRID).add(xx))))
        sum.addAssign(c.mul((dx ? 1 : 2) * (dy ? 1 : 2)))
      }
    }
    n(heights.element(i)).assign(sum.div(16).mul(perGrain))
  })
  const heightAt = (x: unknown, y: unknown) =>
    n(
      heights.element(
        clamp(n(y), 0, GRID - 1)
          .mul(GRID)
          .add(clamp(n(x), 0, GRID - 1)),
      ),
    )

  const step: ComputeNode = Fn(() => {
    If(instanceIndex.greaterThanEqual(count), () => {
      Return()
    })
    const grain = n(grains.element(instanceIndex))
    const p = vec2(grain.x, grain.y).toVar()
    const d = n(u.dir)
    const r = max(p.length(), 1e-6)
    const s = n(p.x.mul(d.y).sub(p.y.mul(d.x)).div(PLATE_RADIUS))
    const dd = n(r.sub(u.ring).div(PLATE_RADIUS))
    const A = n(s.mul(s))
    const B = n(dd.mul(dd))
    const sum = n(A.add(B).add(SOFT))
    const q = n(sum.mul(sum))
    const dEds = n(float(GAIN).mul(B).mul(B.add(SOFT)).mul(s).mul(2).div(q))
    const dEdd = n(float(GAIN).mul(A).mul(A.add(SOFT)).mul(dd).mul(2).div(q))
    const grad = vec2(
      dEds.mul(d.y).add(dEdd.mul(p.x).div(r)),
      dEds.mul(d.x).negate().add(dEdd.mul(p.y).div(r)),
    ).div(PLATE_RADIUS)
    const shake = sqrt(float(GAIN).mul(A).mul(B).div(sum))
    const seed = float(instanceIndex).mul(1.618).add(u.seed)
    const jitter = vec2(hash(seed), hash(seed.add(0.5))).sub(0.5)
    const slide = float(SLIDE)
      .mul(min(1, shake.mul(4)))
      .mul(u.dt)
    p.addAssign(
      grad.mul(-DRIFT).mul(u.dt).add(jitter.mul(u.kick).mul(shake)).add(n(u.tilt).mul(slide)),
    )
    const cx = cellOf(grain.x)
    const cy = cellOf(grain.y)
    const slope = vec2(
      heightAt(cx.add(1), cy).sub(heightAt(cx.sub(1), cy)),
      heightAt(cx, cy.add(1)).sub(heightAt(cx, cy.sub(1))),
    ).div(2 * CELL)
    // Only slopes steeper than the angle of repose slide.
    const steep = slope.length()
    const excess = max(steep.sub(REPOSE), 0).div(max(steep, 1e-6))
    p.subAssign(slope.mul(excess).mul(PILE).mul(u.dt))
    const out = p.length()
    If(out.greaterThan(PLATE_RADIUS), () => {
      p.mulAssign(
        float(2 * PLATE_RADIUS)
          .sub(out)
          .div(out),
      )
    })
    grain.assign(p)
  })().compute(count, [64])

  // Grain contacts: a neighbour grid one diameter wide with a fixed number of slots per cell
  // (atomic counter per cell; a grain takes the next slot). Each grain then sums its pushes
  // from the grains in the 3 × 3 cells around it into a second buffer (Jacobi), copied back.
  const radius = grainSize * 0.75
  const contactCell = 2 * radius
  const side = Math.ceil((2 * PLATE_RADIUS) / contactCell) + 1
  const contactCells = side * side
  const slotCount = instancedArray(contactCells, 'uint').toAtomic()
  const slots = instancedArray(contactCells * SLOTS, 'uint')
  const moved = instancedArray(count, 'vec2')
  const contactOf = (v: unknown) =>
    int(clamp(floor(n(v).add(PLATE_RADIUS).div(contactCell)), 0, side - 1))
  const eachGrain = (body: () => void) =>
    Fn(() => {
      If(instanceIndex.greaterThanEqual(count), () => {
        Return()
      })
      body()
    })().compute(count, [64])
  const clearContacts = Fn(() => {
    If(instanceIndex.greaterThanEqual(contactCells), () => {
      Return()
    })
    atomicStore(slotCount.element(instanceIndex), uint(0))
  })().compute(contactCells, [64])
  const bin = eachGrain(() => {
    const grain = n(grains.element(instanceIndex))
    const cell = contactOf(grain.y).mul(side).add(contactOf(grain.x)).toVar()
    const slot = n(atomicAdd(slotCount.element(cell), uint(1))).toVar()
    If(slot.lessThan(SLOTS), () => {
      n(slots.element(cell.mul(SLOTS).add(int(slot)))).assign(instanceIndex)
    })
  })
  const collide = eachGrain(() => {
    const me = n(grains.element(instanceIndex))
    const p = vec2(me.x, me.y).toVar()
    const push = vec2(0, 0).toVar()
    const cx = contactOf(me.x)
    const cy = contactOf(me.y)
    for (const dy of [-1, 0, 1]) {
      for (const dx of [-1, 0, 1]) {
        const xx = n(clamp(n(cx.add(dx)), 0, side - 1))
        const yy = n(clamp(n(cy.add(dy)), 0, side - 1))
        const cell = yy.mul(side).add(xx).toVar()
        const filled = n(min(n(atomicLoad(slotCount.element(cell))), n(uint(SLOTS)))).toVar()
        for (let k = 0; k < SLOTS; k++) {
          If(uint(k).lessThan(filled), () => {
            const j = n(slots.element(cell.mul(SLOTS).add(k)))
            If(j.notEqual(instanceIndex), () => {
              const other = n(grains.element(j))
              const e = p.sub(vec2(other.x, other.y))
              const d = e.length()
              If(d.lessThan(2 * radius), () => {
                // Coincident grains: split along a direction picked from their indices.
                const dir = select(
                  d.greaterThan(1e-6),
                  e.div(max(d, 1e-6)),
                  vec2(select(instanceIndex.greaterThan(j), 1, -1), 0),
                )
                push.addAssign(
                  dir.mul(
                    float(2 * radius)
                      .sub(d)
                      .mul(0.5),
                  ),
                )
              })
            })
          })
        }
      }
    }
    n(moved.element(instanceIndex)).assign(p.add(push))
  })
  const settle = eachGrain(() => {
    n(grains.element(instanceIndex)).assign(n(moved.element(instanceIndex)))
  })

  const material = new MeshStandardNodeMaterial({ roughness: 0.9 })
  // Vertex shaders may only read storage buffers: read-only views of the same buffers.
  const view = storage(grains.value, 'vec2', count).toReadOnly()
  const heightView = storage(heights.value, 'float', cells).toReadOnly()
  const grain = n(view.element(instanceIndex))
  // Grains rest on top of the pile, not inside it.
  const pile = n(heightView.element(cellOf(grain.y).mul(GRID).add(cellOf(grain.x))))
  material.positionNode = positionLocal.add(vec3(grain.x, grain.y, max(z, pile.add(SAND_BASE_Z))))
  const mesh = new InstancedMesh(new IcosahedronGeometry(grainSize, 0), material, count)
  mesh.frustumCulled = false
  mesh.name = 'sand'

  // The heightfield: vertex k sits on cell (k mod GRID, GRID − 1 − k div GRID).
  const plate = new Float32Array(cells).map((_, c) =>
    onPlate(c % GRID, Math.floor(c / GRID)) ? 1 : 0,
  )
  const plateMask = storage(instancedArray(plate, 'float').value, 'float', cells).toReadOnly()
  const fieldMaterial = new MeshStandardNodeMaterial({ roughness: 0.95 })
  const k = int(vertexIndex)
  const col = k.mod(GRID)
  const cell = int(GRID - 1).sub(k.div(GRID))
  const H = (x: unknown, y: unknown) =>
    n(
      heightView.element(
        clamp(n(y), 0, GRID - 1)
          .mul(GRID)
          .add(clamp(n(x), 0, GRID - 1)),
      ),
    )
  const inside = n(plateMask.element(cell.mul(GRID).add(col))).greaterThan(0.5)
  fieldMaterial.positionNode = vec3(
    positionLocal.x,
    positionLocal.y,
    select(inside, H(col, cell).add(SAND_BASE_Z), float(SAND_BASE_Z - 1)),
  )
  const normal = vec3(
    H(col.sub(1), cell).sub(H(col.add(1), cell)),
    H(col, cell.sub(1)).sub(H(col, cell.add(1))),
    2 * CELL,
  ).normalize()
  fieldMaterial.normalNode = transformNormalToView(varying(normal))
  const heightfield = new Mesh(createHeightfieldGeometry(), fieldMaterial)
  heightfield.frustumCulled = false
  heightfield.name = 'sand-heightfield'

  let frame = 0
  return {
    mesh,
    heightfield,
    /** The grain buffer (positions as xy pairs), for readback in tests. */
    buffer: grains,
    /** Sand heights per grid cell, for readback in tests. */
    heights,
    /** Advances the sand by `dt` seconds (call twice per frame for two substeps). */
    step(renderer: unknown, pose: PlatePose, dt: number, tilt: { x: number; y: number }) {
      const a = (pose.hour * Math.PI) / 180
      u.dir.value.set(Math.sin(a), Math.cos(a))
      u.ring.value = pose.ring
      u.dt.value = dt
      u.kick.value = KICK * Math.sqrt(dt) * (1 + 2.5 * Math.exp(-pose.pulse * 10))
      u.tilt.value.set(tilt.x, tilt.y)
      u.seed.value = (frame++ % 9973) * 0.731
      ;(renderer as WebGPURenderer).compute([
        clear,
        deposit,
        blur,
        step,
        clearContacts,
        bin,
        collide,
        settle,
      ])
    },
    dispose() {
      for (const kernel of [clear, deposit, blur, step, clearContacts, bin, collide, settle])
        kernel.dispose()
      mesh.geometry.dispose()
      material.dispose()
      heightfield.geometry.dispose()
      fieldMaterial.dispose()
    },
  }
}
