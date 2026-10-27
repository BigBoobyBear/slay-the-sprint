// "?" rooms: short stories from the CV with a choice.

export type EventEffect =
  | { kind: 'hp'; amount: number }
  | { kind: 'maxHp'; amount: number }
  | { kind: 'gold'; amount: number }
  | { kind: 'card'; cardId: string }
  | { kind: 'randomCard'; rarity: 'common' | 'uncommon' | 'rare' }
  | { kind: 'randomRelic' }
  | { kind: 'potions' }
  | { kind: 'upgradeRandom'; count: number }
  | { kind: 'pickUpgrade' }
  | { kind: 'pickRemove' }
  | { kind: 'curse'; cardId: string }

export interface EventChoice {
  label: string
  detail: string
  effects: EventEffect[]
  result: string
  requiresGold?: number
}

export interface EventDef {
  id: string
  title: string
  acts: number[]
  art: string
  text: string
  cv: string
  choices: EventChoice[]
}

export const EVENTS: EventDef[] = [
  {
    id: 'rooms-for-rent',
    title: 'Rooms For Rent',
    acts: [1],
    art: 'house',
    text: 'October 2020. A friend has a Java + Spring Boot back end for a room-rental site, and no front end. "You do the UI?"',
    cv: 'Rooms For Rent (Oct–Dec 2020): designed the layout, built every UI/UX and front-end function, converted it to JSP.',
    choices: [
      {
        label: 'Build the whole front end',
        detail: 'Obtain a random uncommon card.',
        effects: [{ kind: 'randomCard', rarity: 'uncommon' }],
        result: 'HTML, CSS, vanilla JS and JSP. You learn that layout is half the product.',
      },
      {
        label: 'Redesign the layout first',
        detail: 'Upgrade 2 random cards.',
        effects: [{ kind: 'upgradeRandom', count: 2 }],
        result: 'You sketch, then build. The friend says it finally looks like a real site.',
      },
      {
        label: 'Focus on exams',
        detail: 'Heal 12 Morale.',
        effects: [{ kind: 'hp', amount: 12 }],
        result: 'PTIT exams come first. You rest and study.',
      },
    ],
  },
  {
    id: 'scrum-master',
    title: 'Someone Has to Run the Sprint',
    acts: [1],
    art: 'people',
    text: 'June 2022. The team needs a Scrum Master. You have read the Scrum Guide twice. The PSM I exam is next month.',
    cv: 'Scrum Master at NCCPLUS (Jun–Jul 2022); PSM I issued 1 Jul 2022.',
    choices: [
      {
        label: 'Step up as Scrum Master',
        detail: 'Obtain Sprint Planning.',
        effects: [{ kind: 'card', cardId: 'sprint-planning' }],
        result: 'Stand-ups get shorter, retros get honest, and the sprint goal holds.',
      },
      {
        label: 'Keep coding',
        detail: 'Upgrade a card of your choice.',
        effects: [{ kind: 'pickUpgrade' }],
        result: 'You stay deep in the code a little longer.',
      },
    ],
  },
  {
    id: 'requirement-clarification',
    title: 'Vague Acceptance Criteria',
    acts: [2, 3],
    art: 'scroll',
    text: 'The ticket says: "Make the product page better." Sprint planning is in an hour.',
    cv: 'Joins requirement clarification sessions and helps write acceptance criteria (GTM Consumer role).',
    choices: [
      {
        label: 'Run a clarification session',
        detail: 'Lose 5 Morale. Upgrade a card of your choice.',
        effects: [{ kind: 'hp', amount: -5 }, { kind: 'pickUpgrade' }],
        result: 'An hour of questions saves a week of rework. The AC is now testable.',
      },
      {
        label: 'Write the AC yourself',
        detail: 'Gain 40 Commits.',
        effects: [{ kind: 'gold', amount: 40 }],
        result: 'Given / When / Then. The BA approves it with one comment.',
      },
      {
        label: 'Ship it and see',
        detail: 'Gain 90 Commits. Add a Tech Debt curse to your deck.',
        effects: [
          { kind: 'gold', amount: 90 },
          { kind: 'curse', cardId: 'tech-debt' },
        ],
        result: 'It shipped. It will come back.',
      },
    ],
  },
  {
    id: 'mentor-junior',
    title: 'A Junior Is Stuck',
    acts: [2, 3],
    art: 'people',
    text: 'A new teammate has been fighting a hydration error since lunch. They have not asked for help yet.',
    cv: 'Trains, mentors and supports new members and junior developers on the Dulux team.',
    choices: [
      {
        label: 'Pair with them',
        detail: 'Lose 6 Morale. Remove a card from your deck.',
        effects: [{ kind: 'hp', amount: -6 }, { kind: 'pickRemove' }],
        result: 'You find the Date() in the render together. They will spot the next one alone.',
      },
      {
        label: 'Write a short guide',
        detail: 'Obtain Mentor a Junior.',
        effects: [{ kind: 'card', cardId: 'mentor' }],
        result: 'The guide ends up in Confluence and saves three more people.',
      },
    ],
  },
  {
    id: 'bim-link',
    title: 'The BIM Request',
    acts: [2],
    art: 'key',
    text: 'Architects want to add Dulux colour samples to the cart straight from their BIM tool, with one link.',
    cv: 'Built an HMAC-signed BIM link that adds colour samples to the cart, plus a test-link generator for UAT.',
    choices: [
      {
        label: 'Sign it with HMAC',
        detail: 'Obtain HMAC-Signed Link.',
        effects: [{ kind: 'card', cardId: 'hmac-link' }],
        result: 'Tamper-proof links, and a generator so UAT can test them.',
      },
      {
        label: 'Leave it unsigned',
        detail: 'Gain 100 Commits. Add a Tech Debt curse.',
        effects: [
          { kind: 'gold', amount: 100 },
          { kind: 'curse', cardId: 'tech-debt' },
        ],
        result: 'Fast, and anyone can edit the cart. Someone will notice.',
      },
    ],
  },
  {
    id: 'ai-tools',
    title: 'A New AI Tool Every Week',
    acts: [2, 3],
    art: 'spark',
    text: 'Claude Code, Codex, Cursor, Copilot, Windsurf, Antigravity, Ollama… Your feed has a new one every morning.',
    cv: 'AI tools on the CV: Claude Code, Codex, Cursor, Copilot, Windsurf, Antigravity, Ollama, OpenClaw, Orca, Pi.',
    choices: [
      {
        label: 'Try them all',
        detail: 'Fill your potion slots with AI tools.',
        effects: [{ kind: 'potions' }],
        result: 'You build your own AI-assisted SDLC workflow from the best parts.',
      },
      {
        label: 'Build your own agent',
        detail: 'Obtain AI Pair Programmer. Lose 8 Morale.',
        effects: [
          { kind: 'card', cardId: 'claude-pair' },
          { kind: 'hp', amount: -8 },
        ],
        result: 'A weekend later you have your own agent harness. It writes tests for you.',
      },
    ],
  },
  {
    id: 'open-to-work',
    title: '#OpenToWork',
    acts: [1, 2, 3],
    art: 'linkedin',
    text: 'A recruiter messages you on LinkedIn: "Saw your profile. Are you open to a chat?"',
    cv: 'LinkedIn: linkedin.com/in/nhannd213. Open to Senior Software Engineer roles in Vietnam and worldwide.',
    choices: [
      {
        label: 'Polish your profile',
        detail: 'Gain 8 Max Morale.',
        effects: [{ kind: 'maxHp', amount: 8 }],
        result: 'New headline, new projects, and this game in the Featured section.',
      },
      {
        label: 'Take the call',
        detail: 'Lose 7 Morale. Obtain a random relic.',
        effects: [{ kind: 'hp', amount: -7 }, { kind: 'randomRelic' }],
        result: 'A good conversation. You leave with a new idea, and maybe an offer.',
      },
    ],
  },
  {
    id: 'cert-exam',
    title: 'Certification Season',
    acts: [1, 2, 3],
    art: 'badge',
    text: 'AWS Cloud Practitioner, Google Educator, Gemini Educator… Another exam voucher is in your inbox.',
    cv: 'Certifications: PSM I (2022), AWS CCP (2024), Google Educator L1 & L2, Gemini Educator, AI for K12 (2025).',
    choices: [
      {
        label: 'Study for the exam (60 Commits)',
        detail: 'Obtain a random relic.',
        requiresGold: 60,
        effects: [{ kind: 'gold', amount: -60 }, { kind: 'randomRelic' }],
        result: 'Passed. Another badge for the LinkedIn profile.',
      },
      {
        label: 'Not this time',
        detail: 'Heal 8 Morale.',
        effects: [{ kind: 'hp', amount: 8 }],
        result: 'You save the voucher for next quarter.',
      },
    ],
  },
]

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]))
