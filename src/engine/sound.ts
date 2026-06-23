export type SoundName =
  | 'HIT' | 'BLOCK' | 'ROLL' | 'PARRY' | 'STAGGER'
  | 'VICTORY' | 'DEFEAT' | 'BUTTON_CLICK' | 'LEVEL_UP'
  | 'RUNE_GAIN' | 'LOOT_DROP' | 'TIMER_DONE'

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
const buffers: Partial<Record<SoundName, AudioBuffer>> = {}
let initialized = false

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.connect(ctx.destination)
  }
  return ctx
}

function tone(audioCtx: AudioContext, freq: number, duration: number, vol: number): AudioBuffer {
  const n = Math.floor(audioCtx.sampleRate * duration)
  const buf = audioCtx.createBuffer(1, n, audioCtx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < n; i++) {
    const t = i / n
    const env = Math.pow(1 - t, 0.4)
    data[i] = Math.sin(2 * Math.PI * freq * i / audioCtx.sampleRate) * env * vol
  }
  return buf
}

function sweep(audioCtx: AudioContext, freqA: number, freqB: number, duration: number, vol: number): AudioBuffer {
  const n = Math.floor(audioCtx.sampleRate * duration)
  const buf = audioCtx.createBuffer(1, n, audioCtx.sampleRate)
  const data = buf.getChannelData(0)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / n
    phase += 2 * Math.PI * (freqA + (freqB - freqA) * t) / audioCtx.sampleRate
    data[i] = Math.sin(phase) * (1 - t) * vol
  }
  return buf
}

function arpeggio(audioCtx: AudioContext, freqs: number[], noteDur: number, vol: number): AudioBuffer {
  const noteN = Math.floor(audioCtx.sampleRate * noteDur)
  const buf = audioCtx.createBuffer(1, noteN * freqs.length, audioCtx.sampleRate)
  const data = buf.getChannelData(0)
  for (let fi = 0; fi < freqs.length; fi++) {
    const freq = freqs[fi]
    for (let i = 0; i < noteN; i++) {
      const t = i / noteN
      const env = Math.pow(1 - t, 0.5)
      data[fi * noteN + i] = Math.sin(2 * Math.PI * freq * i / audioCtx.sampleRate) * env * vol
    }
  }
  return buf
}

export function initSound(): void {
  if (initialized) return
  const audioCtx = getCtx()
  buffers['HIT']          = tone(audioCtx, 240,  0.10, 0.70)
  buffers['BLOCK']        = tone(audioCtx, 100,  0.18, 0.60)
  buffers['ROLL']         = sweep(audioCtx, 700, 200, 0.13, 0.45)
  buffers['PARRY']        = tone(audioCtx, 1200, 0.07, 0.65)
  buffers['STAGGER']      = tone(audioCtx, 130,  0.28, 0.60)
  buffers['VICTORY']      = arpeggio(audioCtx, [523, 659, 784, 1047],      0.13, 0.50)
  buffers['DEFEAT']       = arpeggio(audioCtx, [400, 320, 240, 160],       0.18, 0.45)
  buffers['BUTTON_CLICK'] = tone(audioCtx, 900,  0.035, 0.30)
  buffers['LEVEL_UP']     = arpeggio(audioCtx, [523, 659, 784, 988, 1047], 0.09, 0.50)
  buffers['RUNE_GAIN']    = arpeggio(audioCtx, [880, 1109, 1318],          0.07, 0.40)
  buffers['LOOT_DROP']    = arpeggio(audioCtx, [660, 831, 1047],           0.11, 0.45)
  buffers['TIMER_DONE']   = arpeggio(audioCtx, [784, 784, 784],            0.12, 0.55)
  initialized = true
}

export function playSound(name: SoundName): void {
  const audioCtx = getCtx()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  const buf = buffers[name]
  if (!buf || !masterGain) return
  const source = audioCtx.createBufferSource()
  source.buffer = buf
  source.connect(masterGain)
  source.start()
}

export function setMasterVolume(vol: number): void {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, vol))
}
