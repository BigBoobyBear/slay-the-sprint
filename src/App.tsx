import { useEffect } from 'react'
import { useGame } from './store/gameStore'
import { CodexOverlay, CvOverlay, HelpOverlay, InspectPanel, PickOverlay, PileOverlay } from './ui/components/Overlays'
import { TopBar } from './ui/components/TopBar'
import { CombatScreen } from './ui/screens/CombatScreen'
import { MapScreen } from './ui/screens/MapScreen'
import {
  ActCompleteScreen,
  DefeatScreen,
  EventScreen,
  OnboardingScreen,
  RestScreen,
  RewardScreen,
  ShopScreen,
  TreasureScreen,
  VictoryScreen,
} from './ui/screens/RoomScreens'
import { TitleScreen } from './ui/screens/TitleScreen'

function GameScreen() {
  const screen = useGame((s) => s.run?.screen)
  switch (screen) {
    case 'onboarding':
      return <OnboardingScreen />
    case 'map':
      return <MapScreen />
    case 'combat':
      return <CombatScreen />
    case 'reward':
      return <RewardScreen />
    case 'rest':
      return <RestScreen />
    case 'shop':
      return <ShopScreen />
    case 'treasure':
      return <TreasureScreen />
    case 'event':
      return <EventScreen />
    case 'actComplete':
      return <ActCompleteScreen />
    case 'victory':
      return <VictoryScreen />
    case 'defeat':
      return <DefeatScreen />
    default:
      return null
  }
}

export default function App() {
  const view = useGame((s) => s.view)
  const run = useGame((s) => s.run)
  const setOverlay = useGame((s) => s.setOverlay)

  // ?cv opens the CV straight away (handy for a link in a message).
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).has('cv')) setOverlay('cv')
    } catch {
      /* ignore */
    }
  }, [setOverlay])

  return (
    <>
      {view === 'game' && run ? (
        <div className="flex h-full flex-col">
          <TopBar />
          <main className="flex min-h-0 flex-1 flex-col">
            <GameScreen />
          </main>
        </div>
      ) : (
        <TitleScreen />
      )}
      <PileOverlay />
      <CodexOverlay />
      <HelpOverlay />
      <PickOverlay />
      <InspectPanel />
      <CvOverlay />
    </>
  )
}
