import { useState } from 'react'
import type { Object3D } from 'three'
import type { Appearance, WatchMetadata } from '../../types/watch'
import { downloadBlob, EXPORT_DISCLAIMER, exportWatchGlb } from './exportGlb'

type Props = {
  meta: WatchMetadata
  appearance: Appearance
  getRoot: () => Object3D | null | undefined
}

export function ExportSection({ meta, appearance, getRoot }: Props) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    const root = getRoot()
    if (!root) return
    setExporting(true)
    setError(null)
    try {
      const blob = await exportWatchGlb(root, meta, appearance)
      downloadBlob(blob, `${meta.number}-${meta.id}.glb`)
    } catch (err) {
      console.error('GLB export failed', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="panel-section">
      <h3>Export</h3>
      <button onClick={handleExport} disabled={exporting}>
        {exporting ? 'Exporting…' : 'Download GLB'}
      </button>
      {error && <p className="note error">Export failed: {error}</p>}
      <p className="note">
        Exports the current configuration and time as shown. {EXPORT_DISCLAIMER}
      </p>
    </section>
  )
}
