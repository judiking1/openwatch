import type { WatchMetadata } from '../../types/watch'

export const jagyeongnuMetadata: WatchMetadata = {
  id: 'jagyeongnu',
  number: '011',
  name: 'Jagyeongnu',
  tagline: 'Jang Yeong-sil’s self-striking water clock, poured into a watch.',
  description:
    'After the 자격루 (自擊漏) of 1434. A drop falls from the reservoir every second; the vessel fills over one 시진 (two hours) and a float marks the eight 각 on the wall. When the 시진 ends the vessel siphons empty and the plaque turns to the next zodiac hour, as the original’s wooden figures did. The water is a real Navier–Stokes simulation running on the GPU: every drop stirs it.',
  readingHint: 'Plaque = 시진 (two-hour period). Water level on the scale = minutes into it.',
  howToRead: [
    '시진: the large character on the plaque (子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥), with 초/정 for its first or second hour.',
    'Minutes: the water level against the left scale (0–120 minutes) or the eight 각 on the right.',
    'Seconds: one drop falls from the reservoir every second.',
  ],
  experimental:
    'Liquid level as the clock in a sealed wrist vessel. Fluids already appear in HYT watches (capillary); this one keeps the Joseon logic — inflow vessel, float, 시진 and 각 — and simulates the water with Jos Stam’s Stable Fluids instead of animating it.',
  category: 'Joseon',
  createdAt: '2026-10-06',
  origin: {
    type: 'collaborative',
    note: 'Water clock idea from the user; wrist adaptation and GPU fluid by AI.',
  },
  timeDisplay: { hour: true, minute: true, second: true },
  feasibility: 'conceptual',
}
