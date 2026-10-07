import type { WatchMetadata } from '../../types/watch'

export const jagyeongnuMetadata: WatchMetadata = {
  id: 'jagyeongnu',
  number: '011',
  name: 'Jagyeongnu',
  tagline: 'Jang Yeong-sil’s self-striking water clock, poured into a watch.',
  description:
    'After the 자격루 (自擊漏) of 1434. A drop falls from the reservoir every second; the vessel fills over one 시진 (two hours) and a float marks the eight 각 on the wall. When the 시진 ends the vessel siphons empty and the plaque turns to the next zodiac hour, as the original’s wooden figures did. The water is a real Navier–Stokes simulation running on the GPU: every drop stirs it.',
  readingHint: 'Read the water level against the clock times on the left scale (e.g. 10:08).',
  howToRead: [
    'Time: the water level against the left scale, which prints the clock times of the current two hours (9:00 … 11:00, ticks every 15 minutes).',
    '시진: the plaque — character (子 … 亥), Korean name with 초/정 (first or second hour) and its clock hours, e.g. 巳 · 사시 정 · 09–11.',
    '각: the right scale names the eight traditional quarter-hours (初初 … 正三).',
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
