import { useState } from 'react'
import type { Appearance, CustomizationField, CustomizationGroup } from '../../types/watch'

const GROUP_ORDER: CustomizationGroup[] = ['Case', 'Dial', 'Indicators', 'Crystal', 'Strap']

type Props = {
  fields: CustomizationField[]
  appearance: Appearance
  onChange: (key: string, value: Appearance[string]) => void
  onReset: () => void
  /** Copies a share link; resolves when it is on the clipboard. */
  onShare?: () => Promise<unknown>
}

function Control({
  field,
  value,
  onChange,
}: {
  field: CustomizationField
  value: Appearance[string]
  onChange: (value: Appearance[string]) => void
}) {
  const { control } = field
  switch (control.type) {
    case 'color':
      return (
        <label className="field field-inline">
          <span>{field.label}</span>
          <input type="color" value={String(value)} onChange={(e) => onChange(e.target.value)} />
        </label>
      )
    case 'range':
      return (
        <label className="field">
          <span>
            {field.label} <em>{Number(value).toFixed(2)}</em>
          </span>
          <input
            type="range"
            min={control.min}
            max={control.max}
            step={control.step}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </label>
      )
    case 'select':
      return (
        <label className="field">
          <span>{field.label}</span>
          <select value={String(value)} onChange={(e) => onChange(e.target.value)}>
            {control.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )
  }
}

/** Renders whatever customisation fields the concept declares, grouped. */
export function CustomizationPanel({ fields, appearance, onChange, onReset, onShare }: Props) {
  const [shared, setShared] = useState<'idle' | 'copied' | 'failed'>('idle')
  const share = async () => {
    try {
      await onShare?.()
      setShared('copied')
    } catch {
      setShared('failed')
    }
    setTimeout(() => setShared('idle'), 1800)
  }
  const groups = GROUP_ORDER.map((g) => ({
    group: g,
    fields: fields.filter((f) => f.group === g),
  })).filter((g) => g.fields.length > 0)

  return (
    <section className="panel-section">
      <div className="section-header">
        <h3>Customize</h3>
        <div className="section-actions">
          {onShare && (
            <button className="link-button" onClick={() => void share()}>
              {shared === 'copied'
                ? 'Link copied'
                : shared === 'failed'
                  ? 'Copy failed'
                  : 'Copy link'}
            </button>
          )}
          <button className="link-button" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
      {groups.map(({ group, fields }) => (
        <div key={group} className="field-group">
          <h4>{group}</h4>
          {fields.map((field) => (
            <Control
              key={field.key}
              field={field}
              value={appearance[field.key]}
              onChange={(v) => onChange(field.key, v)}
            />
          ))}
        </div>
      ))}
    </section>
  )
}
