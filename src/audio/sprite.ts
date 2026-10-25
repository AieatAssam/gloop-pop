/** Finds the codec's delay or trim from the sync click at 100 ms (SG §13.11). */
export function findSpriteOffset(data: Float32Array, sampleRate: number): number {
  const limit = Math.min(data.length, Math.ceil(sampleRate * 0.3));
  let peakIndex = 0;
  let peak = 0;
  for (let index = 0; index < limit; index += 1) {
    const magnitude = Math.abs(data[index] ?? 0);
    if (magnitude > peak) {
      peak = magnitude;
      peakIndex = index;
    }
  }
  return peak === 0 ? 0 : peakIndex / sampleRate - 0.1;
}
