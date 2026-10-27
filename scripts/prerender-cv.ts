// Prerender the CV to static HTML at dist/cv/index.html, so recruiters,
// search engines and no-JS visitors get the full CV without running the game.
// Components are loaded through Vite's SSR loader (same JSX pipeline as the app).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createElement, type FC } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import type * as CvModule from '../src/cv/CvPage'
import { personJsonLd } from '../src/cv/jsonLd'
import type * as ProfileModule from '../src/content/profile'

const base = process.env.BASE_PATH ?? '/slay-the-sprint/'
const siteUrl = (process.env.SITE_ORIGIN ?? 'https://bigboobybear.github.io') + base

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { CvPage } = (await vite.ssrLoadModule('/src/cv/CvPage.tsx')) as typeof CvModule
  const { profile } = (await vite.ssrLoadModule('/src/content/profile.ts')) as typeof ProfileModule

  const gameHtml = readFileSync('dist/index.html', 'utf8')
  const styles = gameHtml.match(/<link rel="stylesheet"[^>]*>/g) ?? []

  const escape = (s: string) => s.replace(/</g, '\\u003c')
  const body = renderToStaticMarkup(createElement(CvPage as FC<{ base: string }>, { base }))
  const description = `CV of ${profile.name}: ${profile.headline}. ${profile.location}.`

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${profile.name} — CV · Senior Software Engineer</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${siteUrl}cv/" />
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="${profile.name} — Senior Software Engineer" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${siteUrl}og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
    ${styles.join('\n    ')}
    <script type="application/ld+json">${escape(JSON.stringify(personJsonLd(siteUrl)))}</script>
  </head>
  <body style="background:#fbfaf7">
    ${body}
  </body>
</html>
`

  mkdirSync('dist/cv', { recursive: true })
  writeFileSync('dist/cv/index.html', html)
  console.log(`Prerendered dist/cv/index.html (${(html.length / 1024).toFixed(1)} kB)`)
} finally {
  await vite.close()
}
