import type { ReactNode } from 'react'
import {
  certifications,
  education,
  experience,
  languages,
  personalProjects,
  profile,
  skills,
  strengths,
} from '../content/profile'

interface CvPageProps {
  /** Base URL for links to the game and PDF (Vite BASE_URL). */
  base: string
  /** Shown when the CV opens as an overlay inside the game. */
  onClose?: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid-page">
      <h2 className="border-b-2 border-[var(--cv-accent)] pb-1 font-display text-xl font-bold uppercase tracking-wider text-[var(--cv-accent)]">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** Plain, semantic CV. Used for /cv/ (prerendered) and the in-game overlay. */
export function CvPage({ base, onClose }: CvPageProps) {
  return (
    <div className="cv-page min-h-full">
      <div className="no-print sticky top-0 z-10 border-b border-[var(--cv-rule)] bg-[#fbfaf7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[var(--cv-rule)] px-3 py-1 font-semibold hover:bg-white"
            >
              ← Back to the game
            </button>
          ) : (
            <a href={base} className="rounded border border-[var(--cv-rule)] px-3 py-1 font-semibold hover:bg-white">
              ⚔ Play Slay the Sprint
            </a>
          )}
          <div className="flex gap-2">
            <a
              href={`${base}${profile.cvPdf}`}
              download
              className="rounded bg-[var(--cv-accent)] px-3 py-1 font-semibold text-white hover:opacity-90"
            >
              Download PDF
            </a>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 pt-8 pb-16 text-[15px] leading-relaxed">
        <header>
          <h1 className="font-display text-4xl font-bold text-[var(--cv-accent)] sm:text-5xl">{profile.name}</h1>
          <p className="mt-1 font-semibold">{profile.headline}</p>
          <p className="mt-1 text-[var(--cv-muted)]">
            {profile.location} ·{' '}
            <a className="underline" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>{' '}
            ·{' '}
            <a className="underline" href={profile.linkedin} rel="noopener" target="_blank">
              {profile.linkedinLabel}
            </a>
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {profile.stats.map((s) => (
              <li key={s.label} className="rounded-lg border border-[var(--cv-rule)] bg-white p-3">
                <span className="block font-display text-2xl font-bold text-[var(--cv-accent)]">{s.value}</span>
                <span className="text-xs text-[var(--cv-muted)]">{s.label}</span>
              </li>
            ))}
          </ul>
        </header>

        <Section title="Summary">
          <p>{profile.summary}</p>
        </Section>

        <Section title="Experience">
          {experience.map((job) => (
            <article key={job.company} className="mb-6">
              <h3 className="text-lg font-bold">{job.company}</h3>
              <p className="text-sm text-[var(--cv-muted)]">
                {job.period} · {job.location}
                {job.client ? ` · Client: ${job.client}` : ''}
              </p>
              <p className="text-sm text-[var(--cv-muted)]">
                {job.roles.map((r) => `${r.title} (${r.period})`).join(' · ')}
              </p>
              {job.projects.map((p) => (
                <div key={p.name} className="mt-4">
                  <h4 className="font-semibold text-[var(--cv-accent)]">
                    {p.name} · {p.period}
                  </h4>
                  <p className="text-sm italic text-[var(--cv-muted)]">{p.role}</p>
                  <p className="mt-1">{p.summary}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {p.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-sm italic text-[var(--cv-muted)]">Tech: {p.tech.join(', ')}</p>
                </div>
              ))}
            </article>
          ))}
          <article>
            <h3 className="text-lg font-bold">Personal project</h3>
            {personalProjects.map((p) => (
              <p key={p.name} className="mt-1">
                <strong>{p.name}</strong> ({p.period}): {p.summary} {p.highlights.join(' ')}{' '}
                <em className="text-[var(--cv-muted)]">{p.tech.join(', ')}</em>
              </p>
            ))}
          </article>
        </Section>

        <Section title="Skills">
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[11rem_1fr]">
            {skills.map((s) => (
              <div key={s.area} className="contents">
                <dt className="font-semibold">{s.area}</dt>
                <dd className="mb-2 sm:mb-0">{s.items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Education & certifications">
          <ul className="space-y-1">
            {education.map((e) => (
              <li key={e.school}>
                <strong>{e.school}</strong>
                {e.detail ? `, ${e.detail}` : ''}, {e.period}
              </li>
            ))}
          </ul>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--cv-accent)] text-[var(--cv-accent)]">
                <th className="py-1 pr-2">Certification</th>
                <th className="py-1 pr-2">Issuer</th>
                <th className="py-1">Issued</th>
              </tr>
            </thead>
            <tbody>
              {certifications.map((c) => (
                <tr key={c.name} className="border-b border-[var(--cv-rule)]">
                  <td className="py-1 pr-2">{c.name}</td>
                  <td className="py-1 pr-2">{c.issuer}</td>
                  <td className="py-1">{c.issued}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Languages & strengths">
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[11rem_1fr]">
            <dt className="font-semibold">Languages</dt>
            <dd>{languages}</dd>
            <dt className="font-semibold">Strengths</dt>
            <dd>{strengths}</dd>
            <dt className="font-semibold">Looking for</dt>
            <dd>{profile.lookingFor}</dd>
          </dl>
        </Section>
      </main>
    </div>
  )
}
