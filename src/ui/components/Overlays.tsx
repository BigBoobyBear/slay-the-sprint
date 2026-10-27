import { useMemo, useState } from 'react'
import { ACTS } from '../../content/acts'
import { CARDS, CARD_BY_ID } from '../../content/cards'
import { ENEMIES, ENEMY_BY_ID } from '../../content/enemies'
import { POTIONS, POTION_BY_ID } from '../../content/potions'
import { RELICS, RELIC_BY_ID } from '../../content/relics'
import { canUpgrade, describeCard, resolveCard } from '../../engine/cards'
import { pickableCards } from '../../engine/run'
import type { CardInstance } from '../../engine/types'
import { useGame } from '../../store/gameStore'
import { Icon } from '../art/Icon'
import { Monster } from '../art/Monster'
import { CardView } from './Card'
import { Modal } from './Modal'

function CvNote({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-lg border-l-4 border-gold bg-dusk p-3">
      <p className="text-xs font-bold tracking-wider text-gold uppercase">From the CV</p>
      <p className="mt-1 text-parchment">{text}</p>
    </div>
  )
}

export function InspectPanel() {
  const item = useGame((s) => s.inspect)
  const setInspect = useGame((s) => s.setInspect)
  if (!item) return null
  const close = () => setInspect(null)

  if (item.kind === 'card') {
    const def = CARD_BY_ID[item.id]
    return (
      <Modal title={def.name} onClose={close} z="z-[70]">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <CardView id={item.id} upgraded={item.upgraded} width={170} showInspect={false} />
          <div className="flex-1">
            {def.upgrade && (
              <p className="text-sm text-mist">
                <span className="font-bold text-moss">Upskilled:</span> {describeCard(resolveCard(item.id, true))}
              </p>
            )}
            <CvNote text={def.cv} />
          </div>
        </div>
      </Modal>
    )
  }
  if (item.kind === 'enemy') {
    const def = ENEMY_BY_ID[item.id]
    return (
      <Modal title={def.name} onClose={close} z="z-[70]">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Monster art={def.art} size={130} />
          <div className="flex-1">
            <p className="text-sm text-mist capitalize">
              {def.tier} · {def.hp[0] === def.hp[1] ? def.hp[0] : `${def.hp[0]}–${def.hp[1]}`} Morale
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {Object.values(def.moves).map((m) => (
                <li key={m.name}>
                  <span className="font-semibold text-parchment">{m.name}</span>{' '}
                  <span className="text-mist">
                    —{' '}
                    {m.actions
                      .map((a) =>
                        a.kind === 'attack'
                          ? `attack ${a.amount}${a.times ? `×${a.times}` : ''}`
                          : a.kind === 'addCards'
                            ? `add ${a.count} ${CARD_BY_ID[a.cardId].name}`
                            : a.kind === 'heal'
                              ? `heal ${a.amount}`
                              : a.kind === 'block' || a.kind === 'blockAll'
                                ? `block ${a.amount}${a.kind === 'blockAll' ? ' (all)' : ''}`
                                : `${a.kind === 'debuff' ? 'apply' : 'gain'} ${a.amount} ${a.status}`,
                      )
                      .join(', ')}
                  </span>
                </li>
              ))}
            </ul>
            <CvNote text={def.cv} />
          </div>
        </div>
      </Modal>
    )
  }
  if (item.kind === 'relic') {
    const r = RELIC_BY_ID[item.id]
    return (
      <Modal title={r.name} onClose={close} z="z-[70]">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-dusk text-gold">
            <Icon name={r.art} size={34} />
          </div>
          <div>
            <p className="text-sm text-mist capitalize">{r.tier === 'boss' ? 'Boss relic' : r.tier === 'special' ? 'Special relic' : 'Relic'}</p>
            <p className="mt-1 text-parchment">{r.description}</p>
          </div>
        </div>
        <CvNote text={r.cv} />
      </Modal>
    )
  }
  const p = POTION_BY_ID[item.id]
  return (
    <Modal title={p.name} onClose={close} z="z-[70]">
      <p className="text-sm text-mist">AI tool (single use)</p>
      <p className="mt-1 text-parchment">{p.description}</p>
      <CvNote text={p.cv} />
    </Modal>
  )
}

function CardGrid({ cards, onPick, preview }: { cards: CardInstance[]; onPick?: (c: CardInstance) => void; preview?: 'upgrade' }) {
  const sorted = useMemo(() => [...cards].sort((a, b) => CARD_BY_ID[a.id].type.localeCompare(CARD_BY_ID[b.id].type) || a.id.localeCompare(b.id)), [cards])
  if (!cards.length) return <p className="text-mist">No cards here.</p>
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] justify-items-center gap-4">
      {sorted.map((c) => (
        <li key={c.uid}>
          <CardView id={c.id} upgraded={preview === 'upgrade' ? true : c.upgraded} width={130} onClick={onPick ? () => onPick(c) : undefined} label={onPick ? `Choose ${CARD_BY_ID[c.id].name}` : undefined} />
        </li>
      ))}
    </ul>
  )
}

export function PileOverlay() {
  const overlay = useGame((s) => s.overlay)
  const run = useGame((s) => s.run)
  const setOverlay = useGame((s) => s.setOverlay)
  if (!run || !overlay || !['deck', 'draw', 'discard', 'exhaust'].includes(overlay)) return null
  const c = run.combat
  const piles: Record<string, { title: string; cards: CardInstance[] }> = {
    deck: { title: `Your deck (${run.deck.length} skills)`, cards: run.deck },
    draw: { title: 'Draw pile (shown in random order)', cards: c?.drawPile ?? [] },
    discard: { title: 'Discard pile', cards: c?.discardPile ?? [] },
    exhaust: { title: 'Exhausted', cards: c?.exhaustPile ?? [] },
  }
  const pile = piles[overlay]
  return (
    <Modal title={pile.title} onClose={() => setOverlay(null)} wide>
      <CardGrid cards={pile.cards} />
    </Modal>
  )
}

export function PickOverlay() {
  const run = useGame((s) => s.run)
  const dispatch = useGame((s) => s.dispatch)
  const [hoverPreview, setHoverPreview] = useState(true)
  if (!run?.pick) return null
  const cards = pickableCards(run)
  const upgrade = run.pick.purpose === 'upgrade'
  const title = upgrade ? 'Upskill: choose a card to upgrade' : 'Remove a card from your deck'
  return (
    <Modal title={title} onClose={() => dispatch({ type: 'CANCEL_PICK' })} wide z="z-[60]">
      {upgrade && (
        <label className="mb-3 flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" checked={hoverPreview} onChange={(e) => setHoverPreview(e.target.checked)} /> Show upgraded versions
        </label>
      )}
      {upgrade && !run.deck.some(canUpgrade) ? (
        <p className="text-mist">Every card is already upgraded.</p>
      ) : (
        <CardGrid cards={cards} preview={upgrade && hoverPreview ? 'upgrade' : undefined} onPick={(c) => dispatch({ type: 'PICK_CARD', uid: c.uid })} />
      )}
    </Modal>
  )
}

type CodexTab = 'cards' | 'relics' | 'enemies' | 'potions' | 'timeline'

export function CodexOverlay() {
  const overlay = useGame((s) => s.overlay)
  const run = useGame((s) => s.run)
  const setOverlay = useGame((s) => s.setOverlay)
  const setInspect = useGame((s) => s.setInspect)
  const [tab, setTab] = useState<CodexTab>('cards')
  if (overlay !== 'codex') return null
  const slain = new Set(run?.stats.enemiesSlain ?? [])
  const tabs: { id: CodexTab; label: string }[] = [
    { id: 'cards', label: 'Cards = Skills' },
    { id: 'relics', label: 'Relics = Certifications' },
    { id: 'enemies', label: 'Bestiary = Bugs fixed' },
    { id: 'potions', label: 'Potions = AI tools' },
    { id: 'timeline', label: 'Acts = Career' },
  ]
  return (
    <Modal title="Codex" onClose={() => setOverlay(null)} wide>
      <p className="-mt-2 mb-3 text-sm text-mist">Everything in the game maps to the CV. Select any item to read its real story.</p>
      <div role="tablist" className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => setTab(t.id)} className={`btn px-3 py-1 text-sm ${tab === t.id ? 'border-gold bg-slate text-gold' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'cards' && (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] justify-items-center gap-4">
            {CARDS.filter((c) => c.rarity !== 'special').map((c) => (
              <li key={c.id}>
                <CardView id={c.id} width={130} onClick={() => setInspect({ kind: 'card', id: c.id, upgraded: false })} label={`${c.name}: read the CV story`} />
              </li>
            ))}
          </ul>
        )}
        {tab === 'relics' && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {RELICS.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => setInspect({ kind: 'relic', id: r.id })} className="flex w-full items-start gap-3 rounded-lg border border-slate bg-dusk p-3 text-left hover:border-gold">
                  <Icon name={r.art} size={26} className={run?.relics.includes(r.id) ? 'text-gold' : 'text-mist'} />
                  <span>
                    <span className="block font-semibold text-parchment">{r.name}</span>
                    <span className="block text-xs text-mist">{r.cv}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {tab === 'enemies' && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {ENEMIES.filter((e) => !e.id.startsWith('cve-') || e.id === 'cve-express').map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => setInspect({ kind: 'enemy', id: e.id })} className="flex w-full flex-col items-center rounded-lg border border-slate bg-dusk p-2 text-center hover:border-gold">
                  <Monster art={e.art} size={70} />
                  <span className="mt-1 text-sm font-semibold text-parchment">{e.id === 'cve-express' ? 'CVE Swarm' : e.name}</span>
                  <span className="text-xs text-mist capitalize">
                    {e.tier}
                    {slain.has(e.id) ? ' · defeated ✓' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {tab === 'potions' && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {POTIONS.map((p) => (
              <li key={p.id} className="flex items-start gap-3 rounded-lg border border-slate bg-dusk p-3">
                <span className="mt-0.5 h-6 w-5 shrink-0 rounded-t rounded-b-lg border-2 border-black" style={{ background: p.color }} />
                <span>
                  <span className="block font-semibold text-parchment">
                    {p.name} <span className="font-normal text-mist">— {p.description}</span>
                  </span>
                  <span className="block text-xs text-mist">{p.cv}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {tab === 'timeline' && (
          <ol className="space-y-4">
            {ACTS.map((a) => (
              <li key={a.act} className="rounded-lg border border-slate bg-dusk p-4">
                <p className="font-display text-xl font-bold text-gold">
                  Act {a.act}: {a.name} <span className="text-sm font-normal text-mist">({a.years})</span>
                </p>
                <p className="text-sm font-semibold text-parchment">{a.chapter.heading}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-bone/90">
                  {a.chapter.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Modal>
  )
}
