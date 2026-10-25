// Design §23.2: lifetime discoveries are detected from resolved reducer events.
import type { GameEvent } from '../core/types';
export interface FirstDiscovery { key: string; coins: number }
const discoveries = [
  ['line', 'Nice!', 0], ['double', 'Double!', 10], ['bigPop', 'First Big Pop!', 20],
  ['hugePop', 'First Huge Pop!', 40], ['megaPop', 'First Mega Pop!', 80], ['allClear', 'First All Clear!', 100],
  ['combo5', 'Combo 5! Keep clearing.', 20], ['combo10', 'Combo 10!', 50],
] as const;
export function detectFirsts(events: readonly GameEvent[], firsts: Readonly<Record<string, boolean>>): FirstDiscovery[] {
  const hit = new Set<string>();
  for (const event of events) {
    if (event.type === 'cleared') { const lines = event.rows.length + event.cols.length; if (lines > 0) hit.add('line'); if (lines >= 2) hit.add('double'); }
    if (event.type === 'popped') for (const gloop of event.gloops) { if (gloop.size >= 8) hit.add('bigPop'); if (gloop.size >= 15) hit.add('hugePop'); if (gloop.size >= 24) hit.add('megaPop'); }
    if (event.type === 'allClear') hit.add('allClear');
    if (event.type === 'scored') { if (event.combo >= 5) hit.add('combo5'); if (event.combo >= 10) hit.add('combo10'); }
  }
  return discoveries.filter(([key]) => hit.has(key) && firsts[key] !== true).map(([key, , coins]) => ({ key, coins }));
}
