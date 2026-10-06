import type { WatchMetadata } from '../../types/watch'

export const angbuilguMetadata: WatchMetadata = {
  id: 'angbuilgu',
  number: '010',
  name: 'Angbuilgu',
  tagline: 'A cauldron that looks up at the sky — on the wrist.',
  description:
    'A wristwatch built around the 앙부일구 (仰釜日晷), the concave sundial made for King Sejong in 1434. A virtual sun follows the real sky over Hanyang for today’s date. The tip of the polar needle sits at the centre of the bowl, so its shadow lands on a grid of hour lines (時刻線) and solar-term lines (節氣線): one shadow shows both the time and the season. At night the bowl rests and a moon bead walks the five night watches (五更) along the north rim.',
  readingHint:
    'Day: where the needle-tip shadow falls on the lines. Night: the moon bead on the north rim.',
  howToRead: [
    'Time: the hour line under the shadow tip (5 → 19 h, with 시진 names; fine lines are 15-minute 각).',
    'Season: the curved line under the shadow tip — 동지 (winter) near the rim, 하지 (summer) near the bottom.',
    'Night: the moon bead travels from west to east across the north rim through 初更 … 五更.',
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
