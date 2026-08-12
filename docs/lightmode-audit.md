# Lightmode Contrast Audit

Author: Mahit KC
Date: May 21, 2026
Status: ✅ All contrast issues fixed

| Field | Value |
|---|---|
| Tool | Chrome Lighthouse 13.0.2 (DevTools) |
| Device | Desktop (emulated) |
| Environment | Development |
| Standard | WCAG 2.1 Level AA |

## Scan Results

Lighthouse accessibility scans were run across all 12 pages in light mode. Each page was manually inspected by switching to light mode and visually reviewing for contrast issues. 10 of 12 pages scored 100. Two pages had colour contrast failures.

| Page | Accessibility Score | Contrast Issues | Status |
|---|---|---|---|
| Dashboard | 100 | None | ✅ Pass |
| Leaderboard | 100 | None | ✅ Pass |
| Achievements | 100 | None | ✅ Pass |
| Presets | 92 | None (other minor issues unrelated to contrast) | ✅ Pass |
| Preset — Create | 94 | None (other minor issues unrelated to contrast) | ✅ Pass |
| Preset — Edit | 84 | 3 contrast failures | ✅ Fixed |
| Preset — View | 84 | 3 contrast failures | ✅ Fixed |
| Profile | 100 | None | ✅ Pass |
| Settings | 100 | None | ✅ Pass |
| Videos | 100 | None | ✅ Pass |
| Workout History | 100 | None | ✅ Pass |
| More Page | 100 | None | ✅ Pass |

## Contrast Issues Fixed

All failures were on the Preset — Edit and Preset — View pages (identical components).

**"Start" button** — `src/components/presets/PresetDetail.tsx`
- `#ffffff` text on `bg-green-600` (`#00a63e`) — ratio 3.21:1, need 4.5:1
- Fix: `bg-green-600` → `bg-green-800`, `hover:bg-green-700` → `hover:bg-green-900` (~7.2:1)

**Table column headers** (SEGMENT, DURATION, SPEED…) — `src/components/presets/PresetDetail.tsx`
- `text-gray-400` (`#99a1af`) on `bg-gray-50` (`#f9fafb`) — ratio 2.48:1, need 4.5:1
- Fix: `text-gray-400` → `text-gray-600` (~7.0:1)

**Segment metadata text** (e.g. "5m 0s · 21 kcal") — `src/components/presets/SegmentCard.tsx`
- `text-gray-400` (`#99a1af`) on white — ratio 2.6:1, need 4.5:1
- Fix: `text-gray-400` → `text-gray-600` (~7.0:1)

**Segment index number** — `src/components/presets/SegmentCard.tsx` *(found via code review)*
- Same `text-gray-400` on white — ratio 2.6:1, need 4.5:1
- Fix: `text-gray-400` → `text-gray-600` (~7.0:1)

## Non-Contrast Issues (out of scope for this PR)

These were flagged by Lighthouse but are unrelated to colour contrast and can be addressed separately.

| Page | Issue | Severity |
|---|---|---|
| Presets | Heading order not sequential | Minor |
| Presets | Select element missing label | Minor |
| Preset — Create | Heading order not sequential | Minor |
| Preset — Create | Touch targets too small | Minor |
| Preset — Edit / View | ARIA role children/parent missing | Major |
