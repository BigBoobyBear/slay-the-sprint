import { useId } from 'react'
import { Icon } from './Icon'

// Parametric monster art: one painterly style, many enemies. Each art key
// picks a body shape, colours, eyes and an emblem.

type Shape = 'blob' | 'box' | 'tall' | 'round' | 'serpent' | 'spiky' | 'ghost' | 'golem' | 'tower'

interface Look {
  shape: Shape
  hue: string // main body colour
  shade: string // darker edge colour
  eyes: 1 | 2 | 3
  emblem?: string // icon on the body
  mouth?: 'grin' | 'flat' | 'o' | 'fangs'
  horns?: boolean
  crown?: boolean
  glow?: string
  label?: string // tiny text on the body (e.g. "500")
}

const LOOKS: Record<string, Look> = {
  console: { shape: 'box', hue: '#c94b4b', shade: '#5c1f26', eyes: 2, mouth: 'grin', label: '✕ err' },
  clock: { shape: 'round', hue: '#c9a24b', shade: '#5c4720', eyes: 2, emblem: 'clock', mouth: 'flat' },
  scroll: { shape: 'tall', hue: '#b8a27a', shade: '#4e4230', eyes: 2, mouth: 'o', label: ': any' },
  hairball: { shape: 'spiky', hue: '#4f8fb8', shade: '#1d3a52', eyes: 3, mouth: 'fangs' },
  cup: { shape: 'blob', hue: '#a86b3c', shade: '#4a2b16', eyes: 2, emblem: 'cup', mouth: 'grin' },
  creep: { shape: 'serpent', hue: '#7a9b3f', shade: '#2f4219', eyes: 3, mouth: 'fangs', horns: true },
  boxes: { shape: 'box', hue: '#8a5fc0', shade: '#36245a', eyes: 2, mouth: 'fangs', label: '{ ... }' },
  legacy: { shape: 'golem', hue: '#9b7f5c', shade: '#3b2d1d', eyes: 3, mouth: 'fangs', horns: true, crown: true, glow: '#e8b64c', label: 'v0.0.1' },
  gremlin: { shape: 'blob', hue: '#5fae6a', shade: '#21492a', eyes: 2, emblem: 'a11y', mouth: 'grin' },
  slime: { shape: 'blob', hue: '#e46aa3', shade: '#6a2148', eyes: 2, mouth: 'o' },
  wraith: { shape: 'ghost', hue: '#9fb3d9', shade: '#3a4a6e', eyes: 2, mouth: 'flat' },
  droplet: { shape: 'round', hue: '#57a6d9', shade: '#1b4567', eyes: 2, mouth: 'o', label: '≠' },
  pin: { shape: 'tall', hue: '#e0603a', shade: '#6b2614', eyes: 1, mouth: 'flat' },
  golem: { shape: 'golem', hue: '#d9b24b', shade: '#5a4416', eyes: 2, emblem: 'search', mouth: 'flat' },
  horde: { shape: 'spiky', hue: '#6dbbb0', shade: '#1f4c46', eyes: 3, mouth: 'fangs', horns: true, label: '56' },
  button: { shape: 'box', hue: '#4c5fb8', shade: '#1d2554', eyes: 2, mouth: 'grin', label: 'Click' },
  hydra: { shape: 'serpent', hue: '#3f8fd1', shade: '#163b5c', eyes: 2, mouth: 'fangs', horns: true, glow: '#57a6d9' },
  'hydra-b2c': { shape: 'serpent', hue: '#3f8fd1', shade: '#163b5c', eyes: 2, mouth: 'fangs', horns: true, glow: '#57a6d9', label: 'B2C' },
  'hydra-firebase': { shape: 'serpent', hue: '#e89a3c', shade: '#6b3a12', eyes: 2, mouth: 'fangs', horns: true, glow: '#e0603a', emblem: 'firebase' },
  'hydra-keyvault': { shape: 'serpent', hue: '#4f9b8a', shade: '#1a443c', eyes: 3, mouth: 'flat', horns: true, glow: '#57a6d9', emblem: 'key' },
  shieldx: { shape: 'tower', hue: '#b3263a', shade: '#4a0f19', eyes: 2, emblem: 'shield', mouth: 'flat' },
  popup: { shape: 'box', hue: '#cfd6e4', shade: '#5b6478', eyes: 2, mouth: 'grin', label: 'Accept all' },
  snail: { shape: 'round', hue: '#c08a4f', shade: '#4d3219', eyes: 2, mouth: 'flat', label: 'LCP' },
  shift: { shape: 'box', hue: '#d9774f', shade: '#5a2a16', eyes: 2, mouth: 'o', label: 'CLS' },
  cursor: { shape: 'tall', hue: '#9b8fd1', shade: '#3a3263', eyes: 2, mouth: 'flat', label: 'INP' },
  image: { shape: 'box', hue: '#7aa0a8', shade: '#2a3f44', eyes: 2, mouth: 'o', label: '404' },
  cve: { shape: 'spiky', hue: '#d14f4f', shade: '#4f1616', eyes: 1, mouth: 'fangs', label: 'CVE' },
  crash: { shape: 'golem', hue: '#5a5f6e', shade: '#1b1d24', eyes: 3, mouth: 'fangs', horns: true, glow: '#e0603a', label: '500' },
  deadline: { shape: 'tower', hue: '#6f4a8e', shade: '#24163a', eyes: 3, mouth: 'fangs', horns: true, crown: true, glow: '#e0603a', label: '30/09' },
}

const BODY: Record<Shape, string> = {
  blob: 'M20 92 C10 60 24 30 50 28 C76 26 92 56 82 92 Z',
  box: 'M18 34 Q18 28 24 28 L76 28 Q82 28 82 34 L82 90 Q82 94 78 94 L22 94 Q18 94 18 90 Z',
  tall: 'M30 94 C24 70 26 20 50 14 C74 20 76 70 70 94 Z',
  round: 'M50 22 C78 22 90 46 88 66 C86 88 70 96 50 96 C30 96 14 88 12 66 C10 46 22 22 50 22 Z',
  serpent: 'M28 96 C20 72 34 64 32 48 C30 30 40 14 56 14 C74 14 82 30 76 44 C70 58 82 70 74 96 Z',
  spiky: 'M18 92 L22 52 L12 40 L30 38 L32 20 L46 32 L56 14 L62 32 L80 22 L74 42 L90 46 L78 60 L84 92 Z',
  ghost: 'M20 96 L20 46 C20 24 34 14 50 14 C66 14 80 24 80 46 L80 96 L70 86 L60 96 L50 86 L40 96 L30 86 Z',
  golem: 'M14 96 L18 46 Q20 30 34 26 L66 26 Q80 30 82 46 L86 96 Z',
  tower: 'M26 96 L30 30 L22 30 L22 18 L34 18 L34 24 L44 24 L44 14 L56 14 L56 24 L66 24 L66 18 L78 18 L78 30 L70 30 L74 96 Z',
}

export function Monster({ art, size = 160, hit = false }: { art: string; size?: number; hit?: boolean }) {
  const look = LOOKS[art] ?? LOOKS.console
  const id = useId().replace(/:/g, '')
  const eyeY = look.shape === 'round' ? 52 : look.shape === 'box' ? 50 : 44
  const eyes = look.eyes === 1 ? [50] : look.eyes === 2 ? [40, 60] : [36, 50, 64]
  const mouthY = eyeY + 18
  return (
    <svg viewBox="0 0 100 104" width={size} height={size * 1.04} className={hit ? 'animate-hit' : 'animate-breathe'} aria-hidden="true">
      <defs>
        <radialGradient id={`b${id}`} cx="40%" cy="30%" r="75%">
          <stop offset="0%" stopColor={look.hue} stopOpacity="1" />
          <stop offset="70%" stopColor={look.hue} stopOpacity="0.9" />
          <stop offset="100%" stopColor={look.shade} />
        </radialGradient>
        <filter id={`r${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="2.5" />
        </filter>
      </defs>
      <ellipse cx="50" cy="98" rx="34" ry="5" fill="#000" opacity="0.35" />
      {look.glow && <ellipse cx="50" cy="56" rx="46" ry="44" fill={look.glow} opacity="0.12" />}
      <g filter={`url(#r${id})`}>
        {look.horns && (
          <g fill={look.shade} stroke="#0d0f14" strokeWidth="1.5">
            <path d="M30 34 L18 8 L38 28 Z" />
            <path d="M70 34 L82 8 L62 28 Z" />
          </g>
        )}
        <path d={BODY[look.shape]} fill={`url(#b${id})`} stroke="#0d0f14" strokeWidth="2.5" strokeLinejoin="round" />
        {/* brush highlight */}
        <path d="M32 36 Q40 28 52 30" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
        {look.crown && <path d="M34 22 L38 10 L44 18 L50 6 L56 18 L62 10 L66 22 Z" fill="#e8b64c" stroke="#0d0f14" strokeWidth="1.5" />}
      </g>
      {eyes.map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={eyeY} rx="5" ry="6" fill="#f7f1e3" stroke="#0d0f14" strokeWidth="1.5" />
          <circle cx={x + 1} cy={eyeY + 1} r="2.4" fill={look.glow ?? '#0d0f14'} />
          <path d={`M${x - 6} ${eyeY - 8} L${x + 5} ${eyeY - 5}`} stroke="#0d0f14" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      {look.mouth === 'grin' && <path d={`M38 ${mouthY} Q50 ${mouthY + 8} 62 ${mouthY}`} fill="none" stroke="#0d0f14" strokeWidth="2.5" strokeLinecap="round" />}
      {look.mouth === 'flat' && <path d={`M41 ${mouthY + 2} L59 ${mouthY}`} stroke="#0d0f14" strokeWidth="2.5" strokeLinecap="round" />}
      {look.mouth === 'o' && <ellipse cx="50" cy={mouthY + 2} rx="4" ry="5" fill="#0d0f14" />}
      {look.mouth === 'fangs' && (
        <g>
          <path d={`M36 ${mouthY} Q50 ${mouthY + 10} 64 ${mouthY} Z`} fill="#0d0f14" />
          <path d={`M41 ${mouthY + 1} l2 5 l2 -4 M55 ${mouthY + 1} l2 4 l2 -5`} fill="#f7f1e3" />
        </g>
      )}
      {look.emblem && (
        <g transform={`translate(40 ${mouthY + 6})`} color="#0d0f14" opacity="0.75">
          <Icon name={look.emblem} size={20} strokeWidth={2.2} />
        </g>
      )}
      {look.label && (
        <text x="50" y={mouthY + 20} textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="700" fill="#0d0f14" opacity="0.8">
          {look.label}
        </text>
      )}
    </svg>
  )
}

/** The player character: the Engineer with a glowing laptop. */
export function Engineer({ size = 170, hit = false }: { size?: number; hit?: boolean }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} className={hit ? 'animate-hit' : 'animate-breathe'} aria-hidden="true">
      <defs>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3e57a8" />
          <stop offset="100%" stopColor="#1d2554" />
        </linearGradient>
        <radialGradient id={`g${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#57a6d9" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#57a6d9" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="104" rx="30" ry="5" fill="#000" opacity="0.35" />
      {/* cape / hoodie body */}
      <path d="M22 104 C20 76 28 54 50 52 C72 54 80 76 78 104 Z" fill={`url(#h${id})`} stroke="#0d0f14" strokeWidth="2.5" />
      {/* hood */}
      <path d="M30 44 C28 22 40 12 50 12 C60 12 72 22 70 44 C66 56 34 56 30 44 Z" fill="#2b3a7a" stroke="#0d0f14" strokeWidth="2.5" />
      {/* face */}
      <path d="M37 40 C37 28 43 22 50 22 C57 22 63 28 63 40 C63 48 57 52 50 52 C43 52 37 48 37 40 Z" fill="#e9c9a3" stroke="#0d0f14" strokeWidth="2" />
      <path d="M37 34 C40 24 60 24 63 34 C58 30 42 30 37 34 Z" fill="#1b1b22" />
      {/* glasses */}
      <g fill="none" stroke="#0d0f14" strokeWidth="1.8">
        <rect x="40" y="36" width="8" height="6" rx="2" />
        <rect x="52" y="36" width="8" height="6" rx="2" />
        <path d="M48 39 h4" />
      </g>
      <path d="M46 47 Q50 49 54 47" fill="none" stroke="#0d0f14" strokeWidth="1.6" strokeLinecap="round" />
      {/* laptop */}
      <ellipse cx="50" cy="80" rx="30" ry="18" fill={`url(#g${id})`} />
      <path d="M30 70 L70 70 L66 86 L34 86 Z" fill="#2b3245" stroke="#0d0f14" strokeWidth="2" />
      <path d="M26 86 L74 86 L72 90 L28 90 Z" fill="#8d97ad" stroke="#0d0f14" strokeWidth="1.8" />
      <text x="50" y="81" textAnchor="middle" fontSize="7" fontFamily="ui-monospace, monospace" fill="#57a6d9" fontWeight="700">
        {'</>'}
      </text>
      {/* scarf in Dulux-ish paint colours */}
      <path d="M36 54 Q50 60 64 54 L62 60 Q50 66 38 60 Z" fill="#e0603a" stroke="#0d0f14" strokeWidth="1.5" />
    </svg>
  )
}
