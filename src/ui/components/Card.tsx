import { describeCard, resolveCard, type DescribeContext, type ResolvedCard } from '../../engine/cards'
import { useGame } from '../../store/gameStore'
import { Icon } from '../art/Icon'

const FRAME: Record<string, string> = {
  attack: 'var(--color-attack)',
  skill: 'var(--color-skill)',
  power: 'var(--color-power)',
  status: 'var(--color-status)',
  curse: 'var(--color-curse)',
}

const RARITY_RING: Record<string, string> = {
  starter: '#8d97ad',
  common: '#8d97ad',
  uncommon: '#57a6d9',
  rare: '#e8b64c',
  special: '#6f4a8e',
}

const TYPE_LABEL: Record<string, string> = {
  attack: 'Attack',
  skill: 'Skill',
  power: 'Power',
  status: 'Status',
  curse: 'Curse',
}

interface CardViewProps {
  id: string
  upgraded?: boolean
  ctx?: DescribeContext
  playable?: boolean
  selected?: boolean
  dimmed?: boolean
  width?: number
  /** Card cost override (e.g. temp upgrades) is part of `resolved`. */
  resolved?: ResolvedCard
  onClick?: () => void
  label?: string
  showInspect?: boolean
  /** Current Focus, to tint unaffordable costs red. */
  energy?: number
}

export function CardView({ id, upgraded = false, ctx, playable, selected, dimmed, width = 150, resolved, onClick, label, showInspect = true, energy }: CardViewProps) {
  const setInspect = useGame((s) => s.setInspect)
  const card = resolved ?? resolveCard(id, upgraded)
  const def = card.def
  const frame = FRAME[def.type]
  const scale = width / 150
  const text = describeCard(card, ctx)

  const body = (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[14px] border-[3px] text-left shadow-[0_6px_18px_rgb(0_0_0/0.55)]"
      style={{
        borderColor: selected ? 'var(--color-gold)' : RARITY_RING[def.rarity],
        background: `linear-gradient(170deg, color-mix(in srgb, ${frame} 92%, white 8%) 0%, ${frame} 45%, color-mix(in srgb, ${frame} 55%, black) 100%)`,
        boxShadow: selected ? '0 0 0 3px var(--color-gold), 0 0 24px rgb(232 182 76 / 0.6)' : playable ? '0 0 14px rgb(87 166 217 / 0.55)' : undefined,
      }}
    >
      {/* name banner */}
      <div
        className="relative z-10 mt-2 mr-2 truncate rounded-md border border-black/40 bg-parchment py-[3px] pr-1 text-center font-display leading-tight font-bold text-ink shadow"
        style={{ fontSize: (card.name.length > 16 ? 10.5 : card.name.length > 14 ? 11.5 : card.name.length > 11 ? 12.5 : 14) * scale, marginLeft: 24 * scale, paddingLeft: 8 * scale }}
      >
        <span className={card.upgraded ? 'text-moss' : undefined}>{card.name}</span>
      </div>
      {/* art */}
      <div className="mx-3 mt-1.5 flex items-center justify-center rounded-md border border-black/40 bg-black/30" style={{ height: 62 * scale }}>
        <Icon name={def.art} size={40 * scale} className="text-parchment drop-shadow" strokeWidth={1.6} />
      </div>
      <div className="mt-1 text-center font-display tracking-widest text-bone/80 uppercase" style={{ fontSize: 9.5 * scale }}>
        {TYPE_LABEL[def.type]}
      </div>
      {/* text */}
      <div className="mx-2 mt-0.5 mb-2 flex flex-1 flex-col justify-center rounded-md bg-ink/55 px-1.5 py-1 text-center text-bone" style={{ fontSize: 11.5 * scale, lineHeight: 1.25 }}>
        <p>{text}</p>
        {def.flavor && (
          <p className="mt-1 text-mist italic" style={{ fontSize: 9.5 * scale }}>
            {def.flavor}
          </p>
        )}
      </div>
      {/* cost orb */}
      {!def.unplayable && (
        <div
          className="absolute top-0.5 left-0.5 z-20 flex items-center justify-center rounded-full border-2 border-black/70 font-display font-bold text-ink shadow"
          style={{
            width: 28 * scale,
            height: 28 * scale,
            fontSize: 16 * scale,
            background: energy !== undefined && card.cost > energy ? 'radial-gradient(circle at 35% 30%, #f08a8a, #b3263a 65%)' : 'radial-gradient(circle at 35% 30%, #ffe6a8, #e8b64c 60%, #a8792a)',
          }}
        >
          {card.cost}
        </div>
      )}
    </div>
  )

  return (
    <div className={`relative ${dimmed ? 'opacity-55 saturate-50' : ''}`} style={{ width, height: width * 1.4 }}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          onContextMenu={(e) => {
            e.preventDefault()
            setInspect({ kind: 'card', id, upgraded: card.upgraded })
          }}
          aria-label={label ?? `${card.name}, cost ${card.cost}. ${text}`}
          aria-pressed={selected}
          className="h-full w-full rounded-[14px]"
        >
          {body}
        </button>
      ) : (
        body
      )}
      {showInspect && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setInspect({ kind: 'card', id, upgraded: card.upgraded })
          }}
          className="absolute -top-1.5 -right-1.5 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-gold/70 bg-ink text-xs font-bold text-gold hover:bg-dusk"
          aria-label={`Inspect ${card.name}: see the CV story`}
          title="Inspect: the real CV story"
        >
          i
        </button>
      )}
    </div>
  )
}
