import { ACTS } from '../../content/acts'
import { useGame } from '../../store/gameStore'
import { Icon } from '../art/Icon'
import { PotionSlot, RelicBar } from './Bits'

export function TopBar() {
  const run = useGame((s) => s.run)!
  const dispatch = useGame((s) => s.dispatch)
  const setOverlay = useGame((s) => s.setOverlay)
  const toTitle = useGame((s) => s.toTitle)
  const muted = useGame((s) => s.muted)
  const toggleMute = useGame((s) => s.toggleMute)
  const act = ACTS[run.act - 1]
  const inCombat = run.screen === 'combat'
  const hp = inCombat && run.combat ? run.combat.player.hp : run.hp
  const floor = run.currentNode ? run.map.nodes[run.currentNode]?.floor + 1 : 0

  return (
    <header className="relative z-40 border-b-2 border-black/60 bg-gradient-to-b from-dusk to-night/95 shadow-lg">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5 sm:gap-x-4 sm:px-3">
        <button type="button" onClick={toTitle} className="flex items-center gap-2 text-left" title="Back to the title screen (your run is saved)">
          <span className="font-display text-lg leading-none font-bold text-gold text-shadow">
            <span className="sm:hidden">Nhan</span>
            <span className="hidden sm:inline">Nguyen Duc Nhan</span>
          </span>
          <span className="hidden text-xs text-mist sm:inline">The Engineer</span>
        </button>

        <div className="flex items-center gap-1 font-bold text-[#ff8a8a]" title="Morale (HP)" aria-label={`Morale ${hp} of ${run.maxHp}`}>
          <span aria-hidden="true">♥</span>
          {hp}/{run.maxHp}
        </div>
        <div className="flex items-center gap-1 font-bold text-gold" title="Commits (gold)" aria-label={`${run.gold} Commits`}>
          <Icon name="git" size={16} />
          {run.gold}
        </div>
        <div className="hidden items-center gap-1 sm:flex" aria-label="Potions (AI tools)">
          {run.potions.map((p, i) => (
            <PotionSlot
              key={i}
              id={p}
              disabled={!(inCombat || p === 'ollama')}
              onUse={inCombat ? undefined : p === 'ollama' ? () => dispatch({ type: 'USE_POTION', slot: i }) : undefined}
            />
          ))}
        </div>

        <div className="hidden text-sm text-mist md:block">
          Act {run.act}: <span className="text-parchment">{act?.name}</span> · Floor {floor}/{run.map.floors + 1}
          {run.storyMode && <span className="ml-2 rounded bg-moss/40 px-1.5 text-xs text-bone">Story Mode</span>}
        </div>

        <nav className="ml-auto flex items-center gap-1" aria-label="Game menu">
          <button type="button" className="btn px-2 py-1 text-sm" onClick={() => setOverlay('deck')} title="View your deck (skills)">
            <Icon name="layers" size={16} /> <span className="hidden sm:inline">Deck</span> {run.deck.length}
          </button>
          <button type="button" className="btn px-2 py-1 text-sm" onClick={() => setOverlay('codex')} title="Codex: every card, relic and enemy with its CV story">
            <Icon name="book" size={16} /> <span className="hidden sm:inline">Codex</span>
          </button>
          <button type="button" className="btn px-2 py-1 text-sm" onClick={toggleMute} aria-pressed={!muted} title={muted ? 'Sound is off' : 'Sound is on'}>
            <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
            <span className="sr-only">{muted ? 'Turn sound on' : 'Turn sound off'}</span>
          </button>
          <button type="button" className="btn btn-primary px-3 py-1 text-sm" onClick={() => setOverlay('cv')}>
            <span className="sm:hidden">CV</span>
            <span className="hidden sm:inline">Skip to CV</span>
          </button>
        </nav>
      </div>
      <div className="px-2 pb-1.5 sm:px-3">
        <RelicBar relics={run.relics} />
      </div>
    </header>
  )
}
