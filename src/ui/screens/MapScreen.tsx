import { useEffect, useRef } from 'react'
import { ACTS } from '../../content/acts'
import { COLS, reachableNodes } from '../../engine/map'
import type { MapNode, NodeType } from '../../engine/types'
import { useGame } from '../../store/gameStore'

const NODE_INFO: Record<NodeType, { glyph: string; label: string; color: string; hint: string }> = {
  monster: { glyph: '⚔', label: 'Fight', color: '#d9d2bf', hint: 'A bug or ticket from this chapter.' },
  elite: { glyph: '☠', label: 'Elite', color: '#ff7a6b', hint: 'A tough fight. Drops a relic.' },
  event: { glyph: '?', label: 'Event', color: '#b892e0', hint: 'A story from the CV, with a choice.' },
  rest: { glyph: '☕', label: 'Retro', color: '#7be08a', hint: 'Rest to heal, or Upskill a card.' },
  shop: { glyph: '$', label: 'Market', color: '#e8b64c', hint: 'Spend Commits on cards, relics and AI tools.' },
  treasure: { glyph: '◆', label: 'Merged PR', color: '#57a6d9', hint: 'A chest with a relic.' },
  boss: { glyph: '♛', label: 'Boss', color: '#e0603a', hint: 'The final challenge of this chapter.' },
}

const CELL_X = 74
const CELL_Y = 84
const PAD = 46

export function MapScreen() {
  const run = useGame((s) => s.run)!
  const dispatch = useGame((s) => s.dispatch)
  const scroller = useRef<HTMLDivElement>(null)
  const map = run.map
  const act = ACTS[run.act - 1]
  const reachable = new Set(reachableNodes(map, run.currentNode))
  const visited = new Set(run.visited)
  const width = PAD * 2 + CELL_X * (COLS - 1)
  const height = PAD * 2 + CELL_Y * map.floors + 40

  const pos = (n: MapNode) => {
    // Small per-node jitter keeps the map from looking like a grid.
    const j = ((n.col * 7 + n.floor * 13) % 5) - 2
    const x = n.type === 'boss' ? width / 2 : PAD + n.col * CELL_X + j * 4
    const y = height - PAD - n.floor * CELL_Y - (n.type === 'boss' ? 30 : 0) + j * 3
    return { x, y }
  }

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const floor = run.currentNode ? map.nodes[run.currentNode].floor : -1
    const y = height - PAD - (floor + 1) * CELL_Y
    el.scrollTo?.({ top: Math.max(0, y - el.clientHeight * 0.6), behavior: 'smooth' })
  }, [run.currentNode, map, height])

  const nodes = Object.values(map.nodes)
  const nodeLabel = (n: MapNode) =>
    n.type === 'boss' ? `Boss: ${act.boss.name}` : `Floor ${n.floor + 1}: ${NODE_INFO[n.type].label}. ${NODE_INFO[n.type].hint}`

  return (
    <div className={`bg-act-${run.act} flex min-h-0 flex-1 flex-col md:flex-row`}>
      <aside className="shrink-0 border-b border-black/50 bg-night/70 p-3 md:w-64 md:border-r md:border-b-0">
        <p className="font-display text-sm tracking-widest text-mist uppercase">
          Act {run.act} · {act.years}
        </p>
        <h1 className="font-display text-2xl leading-tight font-bold text-gold text-shadow">{act.name}</h1>
        <p className="mt-1 text-sm text-parchment">{act.subtitle}</p>
        <p className="mt-3 hidden text-sm text-mist md:block">Choose a glowing room to move. Paths only go up.</p>
        <ul className="mt-3 grid grid-cols-4 gap-1 text-xs md:grid-cols-1 md:gap-1.5 md:text-sm">
          {(Object.keys(NODE_INFO) as NodeType[]).map((t) => (
            <li key={t} className="flex items-center gap-2" title={NODE_INFO[t].hint}>
              <span className="w-5 text-center text-lg" style={{ color: NODE_INFO[t].color }} aria-hidden="true">
                {NODE_INFO[t].glyph}
              </span>
              <span className="text-parchment">{NODE_INFO[t].label}</span>
              <span className="hidden text-mist lg:inline">— {NODE_INFO[t].hint}</span>
            </li>
          ))}
        </ul>
      </aside>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block w-full max-w-[560px]" role="group" aria-label={`Map of Act ${run.act}`}>
          <defs>
            <filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="3" />
            </filter>
          </defs>
          <rect x="8" y="8" width={width - 16} height={height - 16} rx="18" fill="#efe3c8" opacity="0.08" stroke="#efe3c8" strokeOpacity="0.15" />
          {/* edges */}
          <g filter="url(#ink)">
            {nodes.flatMap((n) =>
              n.next.map((t) => {
                const a = pos(n)
                const b = pos(map.nodes[t])
                const taken = visited.has(n.id) && visited.has(t)
                const open = n.id === run.currentNode && reachable.has(t)
                return (
                  <line
                    key={`${n.id}>${t}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={taken ? '#e8b64c' : open ? '#efe3c8' : '#8d97ad'}
                    strokeOpacity={taken || open ? 0.9 : 0.35}
                    strokeWidth={taken ? 4 : 2.5}
                    strokeDasharray={taken ? undefined : '2 7'}
                    strokeLinecap="round"
                  />
                )
              }),
            )}
          </g>
          {/* nodes */}
          {nodes.map((n) => {
            const { x, y } = pos(n)
            const info = NODE_INFO[n.type]
            const can = reachable.has(n.id)
            const done = visited.has(n.id)
            const here = n.id === run.currentNode
            const r = n.type === 'boss' ? 30 : 19
            return (
              <g
                key={n.id}
                transform={`translate(${x} ${y})`}
                role="button"
                tabIndex={can ? 0 : -1}
                aria-disabled={!can}
                aria-label={`${nodeLabel(n)}${done ? ' (visited)' : can ? ' (available)' : ''}`}
                onClick={() => can && dispatch({ type: 'CHOOSE_NODE', nodeId: n.id })}
                onKeyDown={(e) => {
                  if (can && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    dispatch({ type: 'CHOOSE_NODE', nodeId: n.id })
                  }
                }}
                className={can ? 'cursor-pointer outline-none [&:focus-visible>circle]:stroke-gold' : ''}
              >
                <title>{nodeLabel(n)}</title>
                {can && (
                  <circle r={r + 8} fill="none" stroke={info.color} strokeWidth="2" opacity="0.8">
                    <animate attributeName="r" values={`${r + 4};${r + 10};${r + 4}`} dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r={r} fill={done ? '#2b3245' : '#141823'} stroke={here ? '#e8b64c' : can ? info.color : '#4a5368'} strokeWidth={here || can ? 3 : 2} />
                <text textAnchor="middle" dominantBaseline="central" fontSize={n.type === 'boss' ? 30 : 19} fill={done && !here ? '#8d97ad' : info.color} style={{ fontFamily: 'Kreon, serif', fontWeight: 700 }}>
                  {info.glyph}
                </text>
                {done && !here && (
                  <path d="M-11 -11 L11 11 M11 -11 L-11 11" stroke="#e8b64c" strokeOpacity="0.7" strokeWidth="2.5" strokeLinecap="round" />
                )}
                {n.type === 'boss' && (
                  <text y={-r - 10} textAnchor="middle" fontSize="13" fill="#efe3c8" style={{ fontFamily: 'Kreon, serif', fontWeight: 700 }}>
                    {act.boss.name}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
