// Tiny Web Audio synth: no audio files to download. Silent until the visitor
// unmutes (muted is the default).

export type Sfx = 'card' | 'hit' | 'block' | 'heal' | 'buff' | 'death' | 'victory' | 'defeat' | 'click'

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.08, slideTo?: number, delay = 0) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + delay
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function noise(dur: number, gain = 0.12) {
  const a = audio()
  if (!a) return
  const buffer = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const src = a.createBufferSource()
  const g = a.createGain()
  const filter = a.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1400
  g.gain.value = gain
  src.buffer = buffer
  src.connect(filter).connect(g).connect(a.destination)
  src.start()
}

export function playSfx(name: Sfx) {
  switch (name) {
    case 'card':
      tone(520, 0.08, 'triangle', 0.05, 760)
      break
    case 'hit':
      noise(0.14)
      tone(140, 0.12, 'square', 0.04, 60)
      break
    case 'block':
      tone(300, 0.1, 'sine', 0.07, 420)
      break
    case 'heal':
      tone(440, 0.18, 'sine', 0.05, 660)
      break
    case 'buff':
      tone(380, 0.12, 'triangle', 0.05, 570)
      break
    case 'death':
      tone(220, 0.4, 'sawtooth', 0.04, 55)
      break
    case 'victory':
      ;[523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.06, undefined, i * 0.11))
      break
    case 'defeat':
      ;[392, 330, 262].forEach((f, i) => tone(f, 0.35, 'sine', 0.06, undefined, i * 0.18))
      break
    case 'click':
      tone(800, 0.03, 'square', 0.02)
      break
  }
}
