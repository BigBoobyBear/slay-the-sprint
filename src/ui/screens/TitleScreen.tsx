import { m } from 'motion/react'
import { useState } from 'react'
import { profile } from '../../content/profile'
import { useGame } from '../../store/gameStore'
import { Icon } from '../art/Icon'
import { Engineer, Monster } from '../art/Monster'

const BASE = import.meta.env.BASE_URL

export function TitleScreen() {
  const run = useGame((s) => s.run)
  const startRun = useGame((s) => s.startRun)
  const continueRun = useGame((s) => s.continueRun)
  const abandonRun = useGame((s) => s.abandonRun)
  const storyMode = useGame((s) => s.storyMode)
  const setStoryMode = useGame((s) => s.setStoryMode)
  const setOverlay = useGame((s) => s.setOverlay)
  const [seed, setSeed] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('seed') ?? ''
    } catch {
      return ''
    }
  })
  const canContinue = run && !['victory', 'defeat'].includes(run.screen)

  return (
    <main className="bg-spire relative flex min-h-full flex-col items-center overflow-x-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-[4vw] opacity-30 select-none" aria-hidden="true">
        <Monster art="legacy" size={140} />
        <Monster art="hydra" size={120} />
        <Monster art="deadline" size={150} />
      </div>

      <m.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative text-center">
        <p className="font-display text-sm tracking-[0.35em] text-mist uppercase">A deckbuilding CV</p>
        <h1 className="mt-1 font-display text-5xl leading-none font-bold text-gold text-shadow sm:text-7xl">
          Slay the <span className="text-ember">Sprint</span>
        </h1>
        <p className="mt-3 text-lg text-parchment">
          Climb six years of the career of <b>{profile.name}</b>
        </p>
        <p className="text-sm text-mist">{profile.headline}</p>
      </m.div>

      <div className="relative mt-6">
        <Engineer size={150} />
      </div>

      <div className="relative mt-4 flex w-full max-w-sm flex-col gap-2">
        {canContinue && (
          <button type="button" className="btn btn-primary text-xl" onClick={continueRun}>
            Continue run (Act {run.act})
          </button>
        )}
        <button type="button" className={`btn text-xl ${canContinue ? '' : 'btn-primary'}`} onClick={() => startRun({ seed })}>
          {canContinue ? 'New run' : 'Start a run'}
        </button>
        <label className="flex cursor-pointer items-center justify-center gap-2 text-sm text-parchment">
          <input type="checkbox" checked={storyMode} onChange={(e) => setStoryMode(e.target.checked)} className="h-4 w-4 accent-[var(--color-gold)]" />
          Story Mode <span className="text-mist">(you can't lose; bosses have half Morale)</span>
        </label>
        <a href={`${BASE}cv/`} className="btn" onClick={(e) => {
          e.preventDefault()
          setOverlay('cv')
        }}>
          Just read the CV (2 min)
        </a>
        <button type="button" className="text-sm text-mist underline hover:text-gold" onClick={() => setOverlay('help')}>
          How to play
        </button>
        <details className="text-center text-xs text-mist">
          <summary className="cursor-pointer">Seed &amp; save options</summary>
          <div className="mt-2 flex items-center justify-center gap-2">
            <label htmlFor="seed">Seed</label>
            <input id="seed" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="random" maxLength={16} className="w-28 rounded border border-slate bg-ink px-2 py-1 text-parchment uppercase" />
          </div>
          {run && (
            <button type="button" className="mt-2 underline hover:text-blood" onClick={abandonRun}>
              Delete saved run
            </button>
          )}
        </details>
      </div>

      <section aria-label="Quick facts for recruiters" className="relative mt-8 w-full max-w-3xl rounded-xl border-2 border-gold/30 bg-night/80 p-4 backdrop-blur">
        <h2 className="text-center font-display text-lg font-bold text-gold">For recruiters, in 10 seconds</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {profile.stats.map((s) => (
            <li key={s.label} className="text-center">
              <span className="block font-display text-2xl font-bold text-parchment">{s.value}</span>
              <span className="text-xs text-mist">{s.label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-sm text-parchment">React · Next.js · TypeScript · GraphQL Federation · Node.js · Elasticsearch · Optimizely · PSM I · AWS CCP</p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
          <a className="text-gold underline" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <a className="inline-flex items-center gap-1 text-gold underline" href={profile.linkedin} target="_blank" rel="noopener">
            <Icon name="linkedin" size={14} /> {profile.linkedinLabel}
          </a>
          <a className="text-gold underline" href={`${BASE}${profile.cvPdf}`} download>
            CV (PDF)
          </a>
        </div>
      </section>

      <footer className="relative mt-6 max-w-xl text-center text-xs text-mist">
        A fan-made tribute to Slay the Spire by Mega Crit, not affiliated with it. All art is original SVG. Built with React, TypeScript and Vite.
      </footer>
    </main>
  )
}
