import type { WatchMetadata } from '../../types/watch'

export const angbuilguMetadata: WatchMetadata = {
  id: 'angbuilgu',
  number: '010',
  name: 'Angbuilgu',
  tagline: 'A cauldron that looks up at the sky — on the wrist.',
  description:
    'A wristwatch built around the 앙부일구 (仰釜日晷), the concave sundial made for King Sejong in 1434. A virtual sun follows the real sky over Hanyang for today’s date. The tip of the polar needle sits at the centre of the bowl, so its shadow lands on a grid of hour lines (時刻線) and solar-term lines (節氣線): one shadow shows both the time and the season. At night the bowl rests and a moon bead walks the five night watches (五更) along the north rim.',
  readingHint:
    'Day: follow the dotted gold line from the shadow tip down to the hour numbers. Night: the moon bead.',
  howToRead: [
    'Time: a dotted gold guide follows the hour line under the shadow tip down to the large numbers (6 → 18 h) and ends in a marker between them; fine lines are 15 minutes. At the top, each 시진 character is labelled with its clock hours (巳 09–11).',
    'Season: the curved line under the shadow tip — 冬至 (December) near the rim, 春秋分 (March / September) in the middle, 夏至 (June) lowest.',
    'Night: the moon bead travels from west to east across the north rim through the five watches, 初更 19–21 … 五更 3–5.',
  ],
  experimental:
    'Solar time is approximated by clock time (no longitude or equation-of-time correction) and the hemisphere is flattened in depth to fit a wrist; the shadows are computed on the true sphere and flattened with it, so the reading stays exact.',
  category: 'Joseon',
  createdAt: '2026-10-06',
  origin: {
    type: 'collaborative',
    note: 'Joseon sundial idea from the user; wrist adaptation, virtual sun and night watches by AI.',
  },
  timeDisplay: { hour: true, minute: true, second: false },
  feasibility: 'conceptual',
}
