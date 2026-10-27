import { AnimatePresence, m } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ACTS } from '../../content/acts'
import { ENEMY_BY_ID } from '../../content/enemies'
import { POTION_BY_ID } from '../../content/potions'
import { resolveInstance } from '../../engine/cards'
import { aliveEnemies, intentDamage } from '../../engine/combat'
import type { EnemyState, IntentKind } from '../../engine/types'
import { useGame } from '../../store/gameStore'
import { Icon } from '../art/Icon'
import { Engineer, Monster } from '../art/Monster'
import { HealthBar, PotionSlot, StatusRow } from '../components/Bits'
import { CardView } from '../components/Card'

interface Popup {
  id: number
  target: 'player' | number
  text: string
  color: string
}

const INTENT_STYLE: Record<IntentKind, { icon: string; color: string; label: string }> = {
  attack: { icon: '⚔', color: '#ff7a6b', label: 'Attack' },
  defend: { icon: '⛨', color: '#7cc4f0', label: 'Defend' },
  buff: { icon: '▲', color: '#e8b64c', label: 'Buff' },
  debuff: { icon: '☁', color: '#b892e0', label: 'Debuff' },
  attackDefend: { icon: '⚔', color: '#ff7a6b', label: 'Attack and defend' },
  attackDebuff: { icon: '⚔', color: '#ff7a6b', label: 'Attack and debuff' },
  summon: { icon: '✚', color: '#e8b64c', label: 'Summon' },
  unknown: { icon: '?', color: '#8d97ad', label: 'Unknown' },
}

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight })
  const [size, setSize] = useState(read)
  useEffect(() => {
    const onResize = () => setSize(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

/** Card width that fits both the width and the height of the window. */
function cardWidthFor({ w, h }: { w: number; h: number }) {
  return Math.round(Math.max(80, Math.min(138, w / 8.5, h / 6.6)))
}

function Intent({ enemy }: { enemy: EnemyState }) {
  const run = useGame((s) => s.run)!
  const c = run.combat!
  const move = enemy.moveId ? ENEMY_BY_ID[enemy.defId].moves[enemy.moveId] : null
  if (!move) return <div className="h-8" />
  const style = INTENT_STYLE[move.intent]
  const dmg = intentDamage(c, enemy)
  const text = dmg ? (dmg.times > 1 ? `${dmg.amount}×${dmg.times}` : String(dmg.amount)) : ''
  const extra = move.intent === 'attackDefend' ? ' ⛨' : move.intent === 'attackDebuff' ? ' ☁' : ''
  return (
    <div
      className="flex h-8 items-center gap-1 rounded-full border border-black/60 bg-ink/80 px-2 font-display text-lg font-bold shadow"
      style={{ color: style.color }}
      title={`${move.name} — ${style.label}${dmg ? ` for ${text} damage` : ''}`}
    >
      <span aria-hidden="true">{style.icon}</span>
      {text}
      <span aria-hidden="true" className="text-sm">
        {extra}
      </span>
      <span className="sr-only">
        Intends: {move.name}, {style.label}
        {dmg ? `, ${text} damage` : ''}
      </span>
    </div>
  )
}

function PopupLayer({ popups, target }: { popups: Popup[]; target: 'player' | number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex justify-center">
      <AnimatePresence>
        {popups
          .filter((p) => p.target === target)
          .map((p, i) => (
            <m.span
              key={p.id}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, y: -50 - i * 14, scale: 1.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute font-display text-3xl font-bold text-shadow"
              style={{ color: p.color }}
            >
              {p.text}
            </m.span>
          ))}
      </AnimatePresence>
    </div>
  )
}

export function CombatScreen() {
  const run = useGame((s) => s.run)!
  const dispatch = useGame((s) => s.dispatch)
  const setOverlay = useGame((s) => s.setOverlay)
  const setInspect = useGame((s) => s.setInspect)
  const fxSeq = useGame((s) => s.fxSeq)
  const overlayOpen = useGame((s) => s.overlay !== null || s.inspect !== null)
  const c = run.combat!
  const viewport = useViewport()
  const cardW = cardWidthFor(viewport)
  const narrow = viewport.w < 640
  const [selected, setSelected] = useState<number | null>(null)
  const [targetIdx, setTargetIdx] = useState(0)
  const [pendingPotion, setPendingPotion] = useState<number | null>(null)
  const [popups, setPopups] = useState<Popup[]>([])
  const [hit, setHit] = useState<Set<'player' | number>>(new Set())
  const popupId = useRef(0)

  const alive = aliveEnemies(c)
  const target = alive[Math.min(targetIdx, alive.length - 1)]

  // Floating numbers and hit shakes from the latest fx.
  useEffect(() => {
    const next: Popup[] = []
    const hits = new Set<'player' | number>()
    for (const fx of c.fx) {
      if (fx.type === 'damage') {
        if (fx.amount > 0) {
          next.push({ id: ++popupId.current, target: fx.target, text: `-${fx.amount}`, color: '#ff6b5e' })
          hits.add(fx.target)
        } else if (fx.blocked > 0) next.push({ id: ++popupId.current, target: fx.target, text: 'Blocked', color: '#7cc4f0' })
      }
      if (fx.type === 'block') next.push({ id: ++popupId.current, target: fx.target, text: `+${fx.amount} ⛨`, color: '#7cc4f0' })
      if (fx.type === 'heal') next.push({ id: ++popupId.current, target: fx.target, text: `+${fx.amount}`, color: '#7be08a' })
    }
    if (!next.length && !hits.size) return
    setPopups((p) => [...p, ...next])
    setHit(hits)
    const ids = new Set(next.map((p) => p.id))
    const t1 = setTimeout(() => setHit(new Set()), 300)
    const t2 = setTimeout(() => setPopups((p) => p.filter((x) => !ids.has(x.id))), 900)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
    // fxSeq changes on every dispatch, so each batch shows once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fxSeq])

  const selectedCard = c.hand.find((h) => h.uid === selected)
  const needsTarget = selectedCard ? resolveInstance(selectedCard, c.tempUpgrades).def.target === 'enemy' && alive.length > 1 : false
  const potionNeedsTarget = pendingPotion !== null

  const play = useCallback(
    (uid: number, targetUid?: number) => {
      dispatch({ type: 'PLAY_CARD', uid, target: targetUid })
      setSelected(null)
    },
    [dispatch],
  )

  const clickCard = (uid: number) => {
    const card = c.hand.find((h) => h.uid === uid)!
    const r = resolveInstance(card, c.tempUpgrades)
    if (r.def.unplayable || r.cost > c.energy) {
      setSelected(uid)
      return
    }
    setPendingPotion(null)
    // On phones the first tap enlarges the card so it can be read.
    if (narrow && selected !== uid) {
      setSelected(uid)
      return
    }
    if (r.def.target === 'enemy' && alive.length > 1) setSelected(!narrow && selected === uid ? null : uid)
    else play(uid, alive[0]?.uid)
  }

  const clickEnemy = (e: EnemyState) => {
    if (pendingPotion !== null) {
      dispatch({ type: 'USE_POTION', slot: pendingPotion, target: e.uid })
      setPendingPotion(null)
      return
    }
    if (selected !== null && needsTarget) play(selected, e.uid)
    else setInspect({ kind: 'enemy', id: e.defId, uid: e.uid })
  }

  const drinkFromSlot = (slot: number) => {
    const id = run.potions[slot]
    if (!id) return
    if (POTION_BY_ID[id].target === 'enemy' && alive.length > 1) {
      setSelected(null)
      setPendingPotion(pendingPotion === slot ? null : slot)
    } else dispatch({ type: 'USE_POTION', slot, target: alive[0]?.uid })
  }

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (overlayOpen || e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (/^[1-9]$/.test(e.key) || e.key === '0') {
        const idx = e.key === '0' ? 9 : Number(e.key) - 1
        const card = c.hand[idx]
        if (card) {
          setSelected(card.uid)
          e.preventDefault()
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        setTargetIdx((t) => (alive.length ? (t + (e.key === 'ArrowRight' ? 1 : alive.length - 1)) % alive.length : 0))
        e.preventDefault()
      } else if ((e.key === 'Enter' || e.key === ' ') && selected !== null && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        play(selected, target?.uid)
        e.preventDefault()
      } else if (e.key === 'e' || e.key === 'E') {
        dispatch({ type: 'END_TURN' })
        setSelected(null)
      } else if ((e.key === 'i' || e.key === 'I') && selectedCard) {
        setInspect({ kind: 'card', id: selectedCard.id, upgraded: resolveInstance(selectedCard, c.tempUpgrades).upgraded })
      } else if (e.key === 'Escape') {
        setSelected(null)
        setPendingPotion(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [c.hand, c.tempUpgrades, alive, selected, selectedCard, target, overlayOpen, dispatch, play, setInspect])

  const act = ACTS[run.act - 1]
  const ctxTarget = target ?? alive[0]
  const n = c.hand.length
  const overlap = n > 1 ? Math.min(0, (Math.min(960, viewport.w - (narrow ? 24 : 260)) - n * cardW) / (n - 1)) : 0

  return (
    <div className={`bg-act-${run.act} relative flex min-h-0 flex-1 flex-col`}>
      <p className="sr-only" aria-live="polite">
        {c.log.slice(-3).join(' ')}
      </p>
      <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 text-center">
        <p className="font-display text-sm tracking-widest text-mist uppercase">
          {c.tier === 'boss' ? 'Boss' : c.tier === 'elite' ? 'Elite' : act.name} · Turn {c.turn}
        </p>
        {(needsTarget || potionNeedsTarget) && (
          <p className="mt-2 rounded-full bg-ink/80 px-4 py-1 text-sm font-semibold whitespace-nowrap text-gold text-shadow" role="status">
            Choose a target: click an enemy (or ←/→ then Enter). Esc cancels.
          </p>
        )}
      </div>

      {/* Battlefield */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-around gap-2 px-2 pt-10 pb-2 sm:px-8">
        <div className="relative flex flex-col items-center">
          <PopupLayer popups={popups} target="player" />
          <Engineer size={Math.max(110, cardW * 1.45)} hit={hit.has('player')} />
          <HealthBar hp={c.player.hp} maxHp={c.player.maxHp} block={c.player.block} />
          <div className="mt-1">
            <StatusRow statuses={c.player.statuses} />
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-end gap-x-2 gap-y-4 sm:gap-x-8">
          <AnimatePresence>
            {c.enemies.map((e) => {
              if (e.hp <= 0)
                return null
              const def = ENEMY_BY_ID[e.defId]
              const isTarget = (needsTarget || potionNeedsTarget) && target?.uid === e.uid
              const targetable = needsTarget || potionNeedsTarget
              return (
                <m.div key={e.uid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6, filter: 'blur(4px)' }} transition={{ duration: 0.35 }} className="relative flex flex-col items-center">
                  <Intent enemy={e} />
                  <PopupLayer popups={popups} target={e.uid} />
                  <button
                    type="button"
                    onClick={() => clickEnemy(e)}
                    onMouseEnter={() => setTargetIdx(alive.findIndex((a) => a.uid === e.uid))}
                    onContextMenu={(ev) => {
                      ev.preventDefault()
                      setInspect({ kind: 'enemy', id: e.defId })
                    }}
                    className={`rounded-xl transition ${targetable ? 'cursor-crosshair hover:drop-shadow-[0_0_14px_rgb(232_182_76/0.9)]' : ''} ${isTarget ? 'drop-shadow-[0_0_14px_rgb(232_182_76/0.9)]' : ''}`}
                    aria-label={`${def.name}, ${e.hp} of ${e.maxHp} Morale${e.block ? `, ${e.block} Block` : ''}. ${targetable ? 'Select as target.' : 'Inspect.'}`}
                  >
                    <Monster art={def.art} size={Math.max(78, cardW * 1.2 * (def.size ?? 1) * (alive.length > 2 ? 0.85 : 1))} hit={hit.has(e.uid)} />
                  </button>
                  <p className="max-w-40 text-center font-display text-sm leading-tight font-bold text-parchment text-shadow">{def.name}</p>
                  <HealthBar hp={e.hp} maxHp={e.maxHp} block={e.block} compact />
                  <div className="mt-1">
                    <StatusRow statuses={e.statuses} />
                  </div>
                </m.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>


      {/* Hand & controls */}
      <div className="relative flex flex-wrap items-end justify-between gap-2 px-2 pb-2 sm:flex-nowrap sm:px-4">
        <div className="order-1 flex items-center gap-2 sm:flex-col">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full border-4 text-xl sm:h-16 sm:w-16 border-black/70 font-display text-2xl font-bold text-ink shadow-[0_0_20px_rgb(232_182_76/0.5)]"
            style={{ background: 'radial-gradient(circle at 35% 30%, #fff1c4, #e8b64c 55%, #9a6b1f)' }}
            title="Focus (energy) left this turn"
            aria-label={`${c.energy} of ${c.maxEnergy} Focus`}
          >
            {c.energy}/{c.maxEnergy}
          </div>
          <button type="button" className="btn px-2 py-0.5 text-xs" onClick={() => setOverlay('draw')} title="Draw pile">
            Draw {c.drawPile.length}
          </button>
          <div className="flex gap-1" aria-label="Potions">
            {run.potions.map((p, i) => (
              <div key={i} className={pendingPotion === i ? 'rounded ring-2 ring-gold' : ''}>
                <PotionSlot id={p} onUse={() => drinkFromSlot(i)} />
              </div>
            ))}
          </div>
        </div>

        <ul className="order-3 flex w-full min-w-0 items-end justify-center pt-6 pb-6 sm:order-2 sm:w-auto sm:flex-1" aria-label="Your hand">
          <AnimatePresence initial={false}>
            {c.hand.map((card, i) => {
              const r = resolveInstance(card, c.tempUpgrades)
              const playable = !r.def.unplayable && r.cost <= c.energy
              const isSel = selected === card.uid
              const mid = (n - 1) / 2
              const rot = (i - mid) * Math.min(4, 24 / Math.max(1, n))
              return (
                <m.li
                  key={card.uid}
                  layout
                  initial={{ opacity: 0, y: 80, scale: 0.8 }}
                  animate={{ opacity: 1, x: isSel && narrow ? (mid - i) * (cardW + overlap) : 0, y: isSel ? (narrow ? -70 : -28) : Math.abs(i - mid) * 3, rotate: isSel ? 0 : rot, scale: isSel ? (narrow ? 1.6 : 1.08) : 1 }}
                  exit={{ opacity: 0, y: -140, scale: 0.7, transition: { duration: 0.22 } }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  style={{ marginLeft: i === 0 ? 0 : overlap, zIndex: isSel ? 40 : i }}
                  className="group relative hover:!z-50"
                >
                  <div className="transition-transform duration-150 group-hover:-translate-y-6 group-hover:scale-105">
                  <CardView
                    id={card.id}
                    resolved={r}
                    width={cardW}
                    ctx={{ player: c.player, target: ctxTarget }}
                    energy={c.energy}
                    playable={playable}
                    selected={isSel}
                    dimmed={!playable}
                    onClick={() => clickCard(card.uid)}
                    label={`${i + 1}: ${r.name}, cost ${r.cost}.`}
                  />
                  </div>
                </m.li>
              )
            })}
          </AnimatePresence>
        </ul>

        <div className="order-2 flex items-center gap-2 sm:order-3 sm:flex-col">
          <button
            type="button"
            className="btn btn-primary px-3 py-2"
            onClick={() => {
              dispatch({ type: 'END_TURN' })
              setSelected(null)
              setPendingPotion(null)
            }}
            title="End turn (E)"
          >
            End Turn
          </button>
          <button type="button" className="btn px-2 py-0.5 text-xs" onClick={() => setOverlay('discard')} title="Discard pile">
            Discard {c.discardPile.length}
          </button>
          {c.exhaustPile.length > 0 && (
            <button type="button" className="btn px-2 py-0.5 text-xs" onClick={() => setOverlay('exhaust')} title="Exhausted cards">
              Exhaust {c.exhaustPile.length}
            </button>
          )}
          <button type="button" className="hidden text-xs text-mist underline hover:text-gold sm:block" onClick={() => setOverlay('help')}>
            <Icon name="book" size={12} className="mr-1 inline" />
            How to play
          </button>
        </div>
      </div>
    </div>
  )
}
