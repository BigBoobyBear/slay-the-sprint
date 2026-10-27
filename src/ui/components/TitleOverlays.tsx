import { CvPage } from '../../cv/CvPage'
import { useGame } from '../../store/gameStore'
import { Modal } from './Modal'

// Overlays reachable from the title screen. Kept out of the lazy game chunk.

const BASE = import.meta.env.BASE_URL

export function CvOverlay() {
  const overlay = useGame((s) => s.overlay)
  const setOverlay = useGame((s) => s.setOverlay)
  if (overlay !== 'cv') return null
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Curriculum vitae">
      <CvPage base={BASE} onClose={() => setOverlay(null)} />
    </div>
  )
}

export function HelpOverlay() {
  const overlay = useGame((s) => s.overlay)
  const setOverlay = useGame((s) => s.setOverlay)
  if (overlay !== 'help') return null
  return (
    <Modal title="How to play" onClose={() => setOverlay(null)}>
      <ul className="list-disc space-y-2 pl-5 text-parchment">
        <li>Climb 3 Acts, one for each chapter of Nhan&apos;s career. Pick a path on the map: fights, ? events, rest sites, shops and treasure.</li>
        <li>
          In a fight you get <b className="text-gold">3 Focus</b> per turn. Click a card to play it. Attacks that need a target: click the card, then the enemy.
        </li>
        <li>Icons above enemies show their next move. Use Block to soak up attacks.</li>
        <li>Win fights to add cards (skills), relics (certifications) and AI-tool potions to your build.</li>
        <li>
          Press <b>i</b> on anything (or right-click it) to read the real CV story behind it.
        </li>
        <li>
          Keyboard: <kbd>1</kbd>–<kbd>9</kbd> select a card, <kbd>←</kbd>/<kbd>→</kbd> choose a target, <kbd>Enter</kbd> play, <kbd>E</kbd> end turn, <kbd>I</kbd> inspect, <kbd>Esc</kbd> cancel.
        </li>
        <li>
          Short on time? <b>Skip to CV</b> is always in the top bar.
        </li>
      </ul>
    </Modal>
  )
}
