export const TOTAL_WAVES = 15;
const SPAWN_INTERVAL_MS = 650;

// Builds the spawn queue (list of enemy types in order) and an HP scale
// factor for a given wave number (1-indexed).
export function buildWave(waveNumber) {
  const queue = [];
  const isBossWave = waveNumber % 5 === 0;

  const gruntCount = 4 + Math.floor(waveNumber * 1.4);
  const runnerCount = Math.floor(waveNumber / 2);
  const bruteCount = Math.floor(waveNumber / 3);

  for (let i = 0; i < gruntCount; i++) queue.push("grunt");
  for (let i = 0; i < runnerCount; i++) queue.push("runner");
  for (let i = 0; i < bruteCount; i++) queue.push("brute");

  // Shuffle for variety, deterministic-ish by wave number.
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom(waveNumber, i) * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }

  if (isBossWave) queue.push("boss");

  const hpScale = 1 + (waveNumber - 1) * 0.18;

  return { queue, hpScale, spawnIntervalMs: SPAWN_INTERVAL_MS };
}

function pseudoRandom(seedA, seedB) {
  const x = Math.sin(seedA * 1337 + seedB * 7.13) * 10000;
  return x - Math.floor(x);
}
