// Dev-only composition for the social preview image (see og.html).
import { createRoot } from 'react-dom/client'
import './index.css'
import { CardView } from './ui/components/Card'
import { Engineer, Monster } from './ui/art/Monster'

function OgCard() {
  return (
    <div className="bg-spire relative flex h-[630px] w-[1200px] items-center overflow-hidden px-16">
      <div className="z-10 w-[560px]">
        <p className="font-display text-xl tracking-[0.35em] text-mist uppercase">A deckbuilding CV</p>
        <h1 className="mt-2 font-display text-8xl leading-none font-bold text-gold text-shadow">
          Slay the <span className="text-ember">Sprint</span>
        </h1>
        <p className="mt-6 text-3xl font-semibold text-parchment">Nguyen Duc Nhan</p>
        <p className="mt-1 text-xl text-mist">Senior Software Engineer · React · Next.js · GraphQL</p>
        <p className="mt-6 text-lg text-parchment/90">Skills are cards. Certifications are relics. Real bugs are the enemies.</p>
      </div>
      <div className="absolute right-10 bottom-10 flex items-end gap-2">
        <Engineer size={190} />
        <Monster art="hydra-b2c" size={150} />
        <Monster art="deadline" size={210} />
      </div>
      <div className="absolute top-10 right-16 flex">
        <div className="-rotate-8"><CardView id="commit" width={130} showInspect={false} /></div>
        <div className="-ml-6 -translate-y-3"><CardView id="graphql-federation" width={130} showInspect={false} /></div>
        <div className="-ml-6 rotate-8"><CardView id="cms-migration" width={130} showInspect={false} /></div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<OgCard />)
