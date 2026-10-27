import { POTION_BY_ID } from '../../content/potions'
import { RELIC_BY_ID } from '../../content/relics'
import { STATUS_INFO } from '../../engine/statuses'
import type { Statuses, StatusId } from '../../engine/types'
import { useGame } from '../../store/gameStore'
import { Icon } from '../art/Icon'

export function HealthBar({ hp, maxHp, block, compact }: { hp: number; maxHp: number; block: number; compact?: boolean }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  return (
    <div className={`relative ${compact ? 'w-24' : 'w-36'}`} role="meter" aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp} aria-label={`Morale ${hp} of ${maxHp}${block ? `, ${block} Block` : ''}`}>
      <div className="h-4 overflow-hidden rounded-full border-2 border-black/80 bg-black/60">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: block > 0 ? 'linear-gradient(90deg,#3f6fa8,#57a6d9)' : 'linear-gradient(90deg,#8a1c2b,#d23a4b)' }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-bone text-shadow">
        {hp}/{maxHp}
      </div>
      {block > 0 && (
        <div className="absolute top-1/2 -left-4 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-black/80 bg-sky text-xs font-bold text-ink shadow" title={`${block} Block`}>
          {block}
        </div>
      )}
    </div>
  )
}

export function StatusRow({ statuses }: { statuses: Statuses }) {
  const entries = Object.entries(statuses).filter(([, v]) => v) as [StatusId, number][]
  if (!entries.length) return <div className="h-6" />
  return (
    <ul className="flex h-6 flex-wrap justify-center gap-1">
      {entries.map(([id, n]) => {
        const info = STATUS_INFO[id]
        return (
          <li
            key={id}
            title={`${info.name}: ${info.description(n)}`}
            className={`flex items-center gap-0.5 rounded border px-1 text-xs font-bold ${info.debuff ? 'border-blood/80 bg-blood/30 text-bone' : 'border-gold/60 bg-black/50 text-gold'}`}
          >
            <span aria-hidden="true">{info.icon}</span>
            <span className="sr-only">{info.name}</span>
            {n}
          </li>
        )
      })}
    </ul>
  )
}

export function RelicBar({ relics }: { relics: string[] }) {
  const setInspect = useGame((s) => s.setInspect)
  return (
    <ul className="flex flex-wrap items-center gap-1" aria-label="Relics (certifications and milestones)">
      {relics.map((id) => {
        const r = RELIC_BY_ID[id]
        if (!r) return null
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => setInspect({ kind: 'relic', id })}
              title={`${r.name}: ${r.description}`}
              aria-label={`Relic ${r.name}: ${r.description}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-dusk hover:bg-slate ${r.tier === 'boss' ? 'border-ember text-ember' : r.tier === 'special' ? 'border-sky text-sky' : 'border-gold/70 text-gold'}`}
            >
              <Icon name={r.art} size={18} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function PotionSlot({ id, onUse, disabled }: { id: string | null; onUse?: () => void; disabled?: boolean }) {
  const setInspect = useGame((s) => s.setInspect)
  const p = id ? POTION_BY_ID[id] : null
  if (!p) return <div className="h-8 w-7 rounded-b-xl rounded-t-md border-2 border-dashed border-mist/30" aria-label="Empty potion slot" />
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onUse}
        onContextMenu={(e) => {
          e.preventDefault()
          setInspect({ kind: 'potion', id: p.id })
        }}
        disabled={disabled}
        title={`${p.name}: ${p.description}${onUse ? ' (click to use)' : ''}`}
        aria-label={`Potion ${p.name}: ${p.description}`}
        className="relative h-8 w-7 rounded-t-md rounded-b-xl border-2 border-black/80 shadow disabled:cursor-default"
        style={{ background: `linear-gradient(180deg, rgb(255 255 255 / 0.25) 0 25%, ${p.color} 25%)` }}
      >
        <span className="absolute top-0.5 left-1/2 h-1.5 w-3 -translate-x-1/2 rounded-sm bg-[#8a6a3c]" />
      </button>
    </div>
  )
}

export function Panel({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border-2 border-gold/40 bg-night/90 p-4 shadow-2xl backdrop-blur ${className}`}>
      {title && <h2 className="mb-3 font-display text-2xl font-bold text-gold text-shadow">{title}</h2>}
      {children}
    </section>
  )
}
