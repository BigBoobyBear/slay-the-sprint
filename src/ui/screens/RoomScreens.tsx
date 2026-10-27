import { m } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { ACTS } from '../../content/acts'
import { CARD_BY_ID } from '../../content/cards'
import { ENEMY_BY_ID } from '../../content/enemies'
import { EVENT_BY_ID } from '../../content/events'
import { POTION_BY_ID } from '../../content/potions'
import { RELIC_BY_ID } from '../../content/relics'
import { profile } from '../../content/profile'
import { canUpgrade } from '../../engine/cards'
import { useGame } from '../../store/gameStore'
import { Icon } from '../art/Icon'
import { Engineer } from '../art/Monster'
import { CardView } from '../components/Card'

const BASE = import.meta.env.BASE_URL

function Room({ title, kicker, children, art }: { title: string; kicker?: string; children: ReactNode; art?: ReactNode }) {
  const run = useGame((s) => s.run)!
  return (
    <div className={`bg-act-${run.act} flex min-h-0 flex-1 justify-center overflow-y-auto px-3 py-6`}>
      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-3xl">
        {kicker && <p className="text-center font-display text-sm tracking-widest text-mist uppercase">{kicker}</p>}
        <h1 className="text-center font-display text-3xl font-bold text-gold text-shadow sm:text-4xl">{title}</h1>
        {art && <div className="mt-4 flex justify-center">{art}</div>}
        <div className="mt-5">{children}</div>
      </m.div>
    </div>
  )
}

function RowButton({ onClick, disabled, icon, children, sub }: { onClick: () => void; disabled?: boolean; icon: ReactNode; children: ReactNode; sub?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-lg border-2 border-gold/40 bg-dusk/90 px-4 py-3 text-left transition hover:border-gold hover:bg-slate disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-ink text-gold">{icon}</span>
      <span>
        <span className="block font-display text-lg font-bold text-parchment">{children}</span>
        {sub && <span className="block text-sm text-mist">{sub}</span>}
      </span>
    </button>
  )
}

// ---------- Onboarding (Neow) ----------

export function OnboardingScreen() {
  const dispatch = useGame((s) => s.dispatch)
  return (
    <Room title="Onboarding Day" kicker="Before the first sprint" art={<Engineer size={130} />}>
      <p className="mx-auto max-w-xl text-center text-parchment">
        You are <b className="text-gold">Nguyen Duc Nhan</b>, a software engineer from Hanoi. Ahead lie three chapters of a career: freelance floors, the Dulux depths, and the Migration Spire.
        Choose one blessing to start.
      </p>
      <div className="mx-auto mt-5 grid max-w-xl gap-2">
        <RowButton icon={<Icon name="scroll" />} onClick={() => dispatch({ type: 'CHOOSE_ONBOARDING', option: 'diploma' })} sub="Obtain the PTIT Diploma relic: +10 Max Morale. (Engineer of IT, 2017–2022)">
          Graduate from PTIT
        </RowButton>
        <RowButton icon={<Icon name="spark" />} onClick={() => dispatch({ type: 'CHOOSE_ONBOARDING', option: 'relic' })} sub="Obtain a random relic (certification).">
          Study for a certification
        </RowButton>
        <RowButton icon={<Icon name="broom" />} onClick={() => dispatch({ type: 'CHOOSE_ONBOARDING', option: 'remove' })} sub="Remove a card from your starting deck.">
          Delete dead code
        </RowButton>
        <RowButton icon={<Icon name="git" />} onClick={() => dispatch({ type: 'CHOOSE_ONBOARDING', option: 'gold' })} sub="Gain 100 Commits to spend at the Market.">
          Start committing early
        </RowButton>
      </div>
    </Room>
  )
}

// ---------- Rewards ----------

export function RewardScreen() {
  const run = useGame((s) => s.run)!
  const dispatch = useGame((s) => s.dispatch)
  const [choosing, setChoosing] = useState<number | null>(null)
  const r = run.reward!
  const tier = run.combat?.tier
  const slain = run.combat ? [...new Set(run.combat.enemies.map((e) => ENEMY_BY_ID[e.defId].name))].join(', ') : ''
  const potionFull = !run.potions.includes(null)

  if (choosing !== null) {
    const reward = r.cardRewards[choosing]
    return (
      <Room title="Choose a skill" kicker="Add one card to your deck">
        <ul className="flex flex-wrap justify-center gap-4">
          {reward.cards.map((id) => (
            <li key={id}>
              <CardView
                id={id}
                width={160}
                onClick={() => {
                  dispatch({ type: 'TAKE_CARD', rewardIndex: choosing, cardId: id })
                  setChoosing(null)
                }}
                label={`Take ${CARD_BY_ID[id].name}`}
              />
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" className="btn" onClick={() => setChoosing(null)}>
            Back
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              dispatch({ type: 'SKIP_CARD', rewardIndex: choosing })
              setChoosing(null)
            }}
          >
            Skip
          </button>
        </div>
      </Room>
    )
  }

  return (
    <Room title={tier === 'boss' ? 'Boss defeated!' : tier === 'elite' ? 'Elite defeated!' : 'Victory'} kicker={`Defeated: ${slain}`}>
      <div className="mx-auto grid max-w-md gap-2">
        {!r.goldTaken && (
          <RowButton icon={<Icon name="git" />} onClick={() => dispatch({ type: 'TAKE_GOLD' })}>
            {r.gold} Commits
          </RowButton>
        )}
        {r.relic && (
          <RowButton icon={<Icon name={RELIC_BY_ID[r.relic].art} />} onClick={() => dispatch({ type: 'TAKE_RELIC' })} sub={RELIC_BY_ID[r.relic].description}>
            Relic: {RELIC_BY_ID[r.relic].name}
          </RowButton>
        )}
        {r.potion && (
          <RowButton
            icon={<span className="h-5 w-4 rounded-t rounded-b-lg border border-black" style={{ background: POTION_BY_ID[r.potion].color }} />}
            onClick={() => dispatch({ type: 'TAKE_POTION' })}
            disabled={potionFull}
            sub={potionFull ? 'Potion slots full. Use or discard one first.' : POTION_BY_ID[r.potion].description}
          >
            AI tool: {POTION_BY_ID[r.potion].name}
          </RowButton>
        )}
        {r.cardRewards.map(
          (cr, i) =>
            !cr.taken && (
              <RowButton key={i} icon={<Icon name="layers" />} onClick={() => setChoosing(i)} sub="Pick 1 of the offered skills">
                Add a card to your deck
              </RowButton>
            ),
        )}
      </div>
      {r.bossRelics && (
        <div className="mt-6">
          <h2 className="text-center font-display text-xl font-bold text-ember">Choose a boss relic</h2>
          <ul className="mx-auto mt-3 grid max-w-2xl gap-2 sm:grid-cols-3">
            {r.bossRelics.map((id) => {
              const rel = RELIC_BY_ID[id]
              return (
                <li key={id}>
                  <button type="button" onClick={() => dispatch({ type: 'TAKE_BOSS_RELIC', relicId: id })} className="flex h-full w-full flex-col items-center rounded-lg border-2 border-ember/60 bg-dusk p-3 text-center hover:border-ember">
                    <Icon name={rel.art} size={34} className="text-ember" />
                    <span className="mt-1 font-display font-bold text-parchment">{rel.name}</span>
                    <span className="text-sm text-mist">{rel.description}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <div className="mt-6 flex justify-center">
        <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'LEAVE_REWARD' })}>
          {tier === 'boss' ? 'Finish the chapter →' : 'Proceed to the map →'}
        </button>
      </div>
    </Room>
  )
}

// ---------- Rest ----------

export function RestScreen() {
  const run = useGame((s) => s.run)!
  const dispatch = useGame((s) => s.dispatch)
  const heal = Math.round(run.maxHp * 0.3)
  return (
    <Room title="Sprint Retro" kicker="A quiet moment between sprints" art={<div className="text-6xl" aria-hidden="true">☕</div>}>
      {run.restDone ? (
        <p className="text-center text-parchment">Rested and ready. What went well, what to improve, and what to try next.</p>
      ) : (
        <div className="mx-auto grid max-w-md gap-2">
          <RowButton icon={<span aria-hidden="true">♥</span>} onClick={() => dispatch({ type: 'REST' })} sub={`Heal ${heal} Morale (${run.hp}/${run.maxHp} now).`}>
            Rest
          </RowButton>
          <RowButton icon={<Icon name="book" />} disabled={!run.deck.some(canUpgrade)} onClick={() => dispatch({ type: 'START_PICK', purpose: 'upgrade', source: 'rest' })} sub="Upgrade a card in your deck.">
            Upskill
          </RowButton>
        </div>
      )}
      <div className="mt-6 flex justify-center">
        <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'LEAVE_ROOM' })}>
          {run.restDone ? 'Back to the map →' : 'Skip →'}
        </button>
      </div>
    </Room>
  )
}

// ---------- Shop ----------

export function ShopScreen() {
  const run = useGame((s) => s.run)!
  const dispatch = useGame((s) => s.dispatch)
  const items = run.shop!.items
  const price = (p: number, sold: boolean) => (
    <span className={`font-bold ${sold ? 'text-mist line-through' : run.gold >= p ? 'text-gold' : 'text-blood'}`}>
      <Icon name="git" size={13} className="mr-0.5 inline" />
      {p}
    </span>
  )
  return (
    <Room title="Stack Overflow Market" kicker={`You have ${run.gold} Commits`}>
      <h2 className="font-display text-lg font-bold text-parchment">Skills</h2>
      <ul className="mt-2 flex flex-wrap justify-center gap-4">
        {items.map(
          (it, i) =>
            it.kind === 'card' && (
              <li key={i} className="flex flex-col items-center gap-1">
                <CardView id={it.id} width={128} dimmed={it.sold} onClick={it.sold ? undefined : () => dispatch({ type: 'BUY', index: i })} label={`Buy ${CARD_BY_ID[it.id].name} for ${it.price} Commits`} />
                {price(it.price, it.sold)}
              </li>
            ),
        )}
      </ul>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-bold text-parchment">Relics &amp; AI tools</h2>
          <ul className="mt-2 grid gap-2">
            {items.map((it, i) => {
              if (it.kind !== 'relic' && it.kind !== 'potion') return null
              const name = it.kind === 'relic' ? RELIC_BY_ID[it.id].name : POTION_BY_ID[it.id].name
              const desc = it.kind === 'relic' ? RELIC_BY_ID[it.id].description : POTION_BY_ID[it.id].description
              const blocked = it.kind === 'potion' && !run.potions.includes(null)
              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={it.sold || run.gold < it.price || blocked}
                    onClick={() => dispatch({ type: 'BUY', index: i })}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate bg-dusk p-2 text-left hover:border-gold disabled:opacity-50"
                  >
                    <span>
                      <span className="block font-semibold text-parchment">{name}</span>
                      <span className="block text-xs text-mist">{blocked ? 'Potion slots full' : desc}</span>
                    </span>
                    {price(it.price, it.sold)}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-parchment">Services</h2>
          {items.map(
            (it, i) =>
              it.kind === 'remove' && (
                <button
                  key={i}
                  type="button"
                  disabled={it.sold || run.gold < it.price}
                  onClick={() => dispatch({ type: 'START_PICK', purpose: 'remove', source: 'shop' })}
                  className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-slate bg-dusk p-2 text-left hover:border-gold disabled:opacity-50"
                >
                  <span>
                    <span className="block font-semibold text-parchment">Refactor out a card</span>
                    <span className="block text-xs text-mist">Remove a card from your deck.</span>
                  </span>
                  {price(it.price, it.sold)}
                </button>
              ),
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'LEAVE_ROOM' })}>
          Leave the Market →
        </button>
      </div>
    </Room>
  )
}

// ---------- Treasure ----------

export function TreasureScreen() {
  const run = useGame((s) => s.run)!
  const dispatch = useGame((s) => s.dispatch)
  const opened = run.lastMessage === 'opened'
  const last = run.relics[run.relics.length - 1]
  return (
    <Room title="A Merged PR" kicker="Approved, green, and merged" art={<Icon name="git" size={80} className="text-sky" />}>
      {!opened ? (
        <div className="flex justify-center">
          <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_TREASURE' })}>
            Open the chest
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-parchment">
            You found <b className="text-gold">{RELIC_BY_ID[last]?.name}</b>: {RELIC_BY_ID[last]?.description}
          </p>
          <p className="mt-1 text-sm text-mist">{RELIC_BY_ID[last]?.cv}</p>
          <button type="button" className="btn btn-primary mt-5" onClick={() => dispatch({ type: 'LEAVE_ROOM' })}>
            Back to the map →
          </button>
        </div>
      )}
    </Room>
  )
}

// ---------- Event ----------

export function EventScreen() {
  const run = useGame((s) => s.run)!
  const dispatch = useGame((s) => s.dispatch)
  const ev = EVENT_BY_ID[run.event!.id]
  const resolved = run.event!.resolved
  return (
    <Room title={ev.title} kicker="? Event" art={<Icon name={ev.art} size={72} className="text-curse drop-shadow" />}>
      <p className="mx-auto max-w-xl text-center text-lg text-parchment">{ev.text}</p>
      {!resolved ? (
        <div className="mx-auto mt-5 grid max-w-xl gap-2">
          {ev.choices.map((ch, i) => (
            <RowButton key={ch.label} icon={<span className="font-display font-bold">{i + 1}</span>} disabled={Boolean(ch.requiresGold && run.gold < ch.requiresGold)} onClick={() => dispatch({ type: 'EVENT_CHOICE', choice: i })} sub={ch.detail}>
              {ch.label}
            </RowButton>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-5 max-w-xl text-center">
          <p className="text-parchment italic">{resolved}</p>
          <div className="mt-4 rounded-lg border-l-4 border-gold bg-dusk p-3 text-left">
            <p className="text-xs font-bold tracking-wider text-gold uppercase">From the CV</p>
            <p className="mt-1 text-parchment">{ev.cv}</p>
          </div>
          <button type="button" className="btn btn-primary mt-5" onClick={() => dispatch({ type: 'LEAVE_ROOM' })}>
            Continue →
          </button>
        </div>
      )}
    </Room>
  )
}

// ---------- Act complete (chapter summary) ----------

export function ActCompleteScreen() {
  const run = useGame((s) => s.run)!
  const dispatch = useGame((s) => s.dispatch)
  const act = ACTS[run.act - 1]
  const next = ACTS[run.act]
  return (
    <Room title={`Act ${run.act} complete`} kicker={act.name}>
      <section className="rounded-xl border-2 border-gold/40 bg-night/85 p-5">
        <h2 className="font-display text-xl font-bold text-gold">{act.chapter.heading}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-parchment">
          {act.chapter.lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
      {next && (
        <p className="mt-5 text-center text-parchment">
          Next: <b className="text-gold">Act {next.act} — {next.name}</b> ({next.years}). Your Morale is fully restored.
        </p>
      )}
      <div className="mt-5 flex justify-center">
        <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'NEXT_ACT' })}>
          Begin Act {run.act + 1} →
        </button>
      </div>
    </Room>
  )
}

// ---------- Endings ----------

function RunStats() {
  const run = useGame((s) => s.run)!
  const s = run.stats
  const items = [
    ['Floors climbed', s.floorsClimbed],
    ['Bugs fixed (enemies)', s.enemiesSlain.length],
    ['Elites', s.elitesSlain],
    ['Bosses', s.bossesSlain],
    ['Cards played', s.cardsPlayed],
    ['Damage dealt', s.damageDealt],
  ] as const
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <li key={label} className="rounded-lg border border-slate bg-dusk p-2 text-center">
          <span className="block font-display text-2xl font-bold text-gold">{value}</span>
          <span className="text-xs text-mist">{label}</span>
        </li>
      ))}
    </ul>
  )
}

function ContactCta() {
  const setOverlay = useGame((s) => s.setOverlay)
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      <a className="btn btn-primary" href={`mailto:${profile.email}?subject=${encodeURIComponent('Hello from Slay the Sprint')}`}>
        Email Nhan
      </a>
      <a className="btn" href={profile.linkedin} target="_blank" rel="noopener">
        LinkedIn
      </a>
      <a className="btn" href={`${BASE}${profile.cvPdf}`} download>
        Download CV (PDF)
      </a>
      <button type="button" className="btn" onClick={() => setOverlay('cv')}>
        Read the CV
      </button>
    </div>
  )
}

export function VictoryScreen() {
  const run = useGame((s) => s.run)!
  const startRun = useGame((s) => s.startRun)
  return (
    <Room title="The Offer" kicker="All three chapters cleared" art={<Engineer size={140} />}>
      <p className="mx-auto max-w-2xl text-center text-lg text-parchment">
        The Contentful deadline falls, and the migration ships on time. You have seen six years of <b className="text-gold">{profile.name}</b>&apos;s career, one card at a time.
      </p>
      <section className="mt-5 rounded-xl border-2 border-gold/40 bg-night/85 p-5">
        <h2 className="font-display text-xl font-bold text-gold">{profile.headline}</h2>
        <p className="mt-2 text-parchment">{profile.summary}</p>
        <p className="mt-3 text-sm text-mist">
          <b className="text-parchment">Looking for:</b> {profile.lookingFor}
        </p>
        <ContactCta />
      </section>
      <div className="mt-5">
        <RunStats />
      </div>
      <p className="mt-3 text-center text-sm text-mist">
        Seed {run.seed}
        {run.storyMode ? ' · Story Mode' : ''}
      </p>
      <div className="mt-4 flex justify-center">
        <button type="button" className="btn" onClick={() => startRun()}>
          Play again
        </button>
      </div>
    </Room>
  )
}

export function DefeatScreen() {
  const run = useGame((s) => s.run)!
  const startRun = useGame((s) => s.startRun)
  const setStoryMode = useGame((s) => s.setStoryMode)
  const where = run.combat ? [...new Set(run.combat.enemies.map((e) => ENEMY_BY_ID[e.defId].name))].join(', ') : 'the climb'
  return (
    <Room title="Sprint failed" kicker={`Burned out against ${where}`}>
      <p className="mx-auto max-w-xl text-center text-parchment">
        Every engineer has a release that goes wrong. Here is the real story anyway: <b className="text-gold">{profile.name}</b>, {profile.headline}.
      </p>
      <section className="mt-5 rounded-xl border-2 border-gold/40 bg-night/85 p-5">
        <p className="text-parchment">{profile.summary}</p>
        <ContactCta />
      </section>
      <div className="mt-5">
        <RunStats />
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button type="button" className="btn btn-primary" onClick={() => startRun()}>
          Try again
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setStoryMode(true)
            startRun()
          }}
        >
          Try again in Story Mode
        </button>
      </div>
    </Room>
  )
}
