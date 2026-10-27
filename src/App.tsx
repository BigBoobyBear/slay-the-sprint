import { LazyMotion } from 'motion/react'
import { Suspense, lazy, useEffect } from 'react'
import { loadEngine, useGame } from './store/gameStore'
import { CvOverlay, HelpOverlay } from './ui/components/TitleOverlays'
import { TitleScreen } from './ui/screens/TitleScreen'

const loadGame = () => import('./Game')
const Game = lazy(loadGame)
const loadMotionFeatures = () => import('./ui/motionFeatures').then((mod) => mod.default)

function Loading() {
  return (
    <div className="bg-spire flex h-full items-center justify-center">
      <p className="font-display text-xl text-gold" role="status">
        Shuffling the deck…
      </p>
    </div>
  )
}

export default function App() {
  const view = useGame((s) => s.view)
  const run = useGame((s) => s.run)
  const setOverlay = useGame((s) => s.setOverlay)

  useEffect(() => {
    // ?cv opens the CV straight away (handy for a link in a message).
    try {
      if (new URLSearchParams(window.location.search).has('cv')) setOverlay('cv')
    } catch {
      /* ignore */
    }
    // Fetch the game in the background so "Start a run" is instant.
    void loadGame()
    void loadEngine()
  }, [setOverlay])

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      {view === 'game' && run ? (
        <Suspense fallback={<Loading />}>
          <Game />
        </Suspense>
      ) : (
        <TitleScreen />
      )}
      <HelpOverlay />
      <CvOverlay />
    </LazyMotion>
  )
}
