// Player-facing strings are copied from design §16.4.
export const S = {
  score: 'Score',
  best: (n: string): string => `Best ${n}`,
  combo: (count: number, multiplier: string): string => `Combo ${count} ×${multiplier}`,
  comboLost: 'Combo lost',
  pop: 'Pop!',
  bigPop: 'Big Pop!',
  hugePop: 'Huge Pop!',
  megaPop: 'Mega Pop!',
  allClear: 'All clear!',
  double: 'Double!',
  triple: 'Triple!',
  quad: 'Quad!',
  newBest: 'New best!',
};
