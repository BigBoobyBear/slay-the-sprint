import { CodexOverlay, InspectPanel, PickOverlay, PileOverlay } from './ui/components/Overlays'
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
import { useGame } from './store/gameStore'

// The playable game. Lazy-loaded so the title screen and CV appear first.

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

export default function Game() {
  return (
    <>
      <div className="flex h-full flex-col">
        <TopBar />
        <main className="flex min-h-0 flex-1 flex-col">
          <GameScreen />
        </main>
      </div>
      <PileOverlay />
      <CodexOverlay />
      <PickOverlay />
      <InspectPanel />
    </>
  )
}
