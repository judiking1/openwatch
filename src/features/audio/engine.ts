import type { SoundProfile } from '../../types/watch'

/**
 * Procedural watch sounds with the Web Audio API — no samples are downloaded.
 *
 * - Escapement: a 6 ms burst of noise through a resonant band-pass (pallet on escape wheel);
 *   the tock is pitched a little lower than the tick.
 * - Drop: a sine sweeping down an octave in 90 ms plus a soft noise splash (Jagyeongnu).
 * - Ratchet: a train of five clicks (Cipher's rings).
 * - Crackle: two or three very short high clicks a few ms apart (a spark; Plasma).
 */
class WatchAudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null

  /** Must be called from a user gesture (browser autoplay rules). */
  async start() {
    if (!this.ctx) {
      const ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = 0
      master.connect(ctx.destination)
      const noise = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate)
      const data = noise.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      this.ctx = ctx
      this.master = master
      this.noise = noise
    }
    await this.ctx.resume()
  }

  stop() {
    void this.ctx?.suspend()
  }

  get running() {
    return this.ctx?.state === 'running'
  }

  setGain(value: number) {
    if (!this.ctx || !this.master) return
    this.master.gain.setTargetAtTime(value, this.ctx.currentTime, 0.08)
  }

  /** Plays one event of `profile`, `delay` seconds from now. */
  play(profile: SoundProfile, accent: boolean, delay = 0) {
    if (!this.running) return
    const t = this.ctx!.currentTime + Math.max(0, delay)
    switch (profile.kind) {
      case 'escapement':
        return this.click(t, accent ? 3400 : 4300, 0.006, 0.5)
      case 'drop':
        return this.drop(t)
      case 'ratchet':
        for (let i = 0; i < 5; i++) this.click(t + i * 0.028, 2400 + i * 120, 0.004, 0.45)
        return
      case 'crackle':
        return this.crackle(t, accent)
      case 'quiet':
        return
    }
  }

  private crackle(t: number, accent: boolean) {
    const sparks = accent ? 3 : 2
    for (let i = 0; i < sparks; i++) {
      const at = t + i * (0.003 + Math.random() * 0.006)
      this.click(at, 5200 + Math.random() * 2600, 0.0015, (accent ? 0.5 : 0.28) / (i + 1))
    }
  }

  private click(t: number, frequency: number, length: number, level: number) {
    const ctx = this.ctx!
    const source = ctx.createBufferSource()
    source.buffer = this.noise
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = frequency
    band.Q.value = 9
    const env = ctx.createGain()
    env.gain.setValueAtTime(level, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + length * 4)
    source.connect(band).connect(env).connect(this.master!)
    source.start(t, Math.random() * 0.2, length * 4)
  }

  private drop(t: number) {
    const ctx = this.ctx!
    const tone = ctx.createOscillator()
    tone.type = 'sine'
    tone.frequency.setValueAtTime(1400, t)
    tone.frequency.exponentialRampToValueAtTime(700, t + 0.09)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(0.35, t + 0.005)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
    tone.connect(env).connect(this.master!)
    tone.start(t)
    tone.stop(t + 0.25)
    this.click(t, 1800, 0.02, 0.08)
  }
}

/** One engine per page; its AudioContext is created on the first user-initiated start. */
export const watchAudio = new WatchAudioEngine()
