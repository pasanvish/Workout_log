export const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25];
export const MAX_BAR_LOAD = 2000;

export function plateLoading(target: number, bar: number, plates: number[]) {
  if (!Number.isFinite(target) || !Number.isFinite(bar) || target < bar || bar < 0 || target > MAX_BAR_LOAD) return;
  const load = Math.round(target * 100) - Math.round(bar * 100);
  const sizes = [...new Set(plates)].filter(size => PLATE_SIZES.includes(size)).sort((a, b) => b - a);
  // Each full pair contributes a multiple of 0.5 kg to the total bar load.
  const limit = Math.floor(load / 50);
  const counts = Array<number>(limit + 1).fill(Infinity);
  const choices = Array<number>(limit + 1).fill(-1);
  counts[0] = 0;
  const pairSizes = sizes.map(size => size * 4);
  for (let total = 1; total <= limit; total++) {
    pairSizes.forEach((pair, index) => {
      if (pair <= total && counts[total - pair] + 1 < counts[total]) {
        counts[total] = counts[total - pair] + 1;
        choices[total] = index;
      }
    });
  }

  let reachable = limit;
  while (!Number.isFinite(counts[reachable])) reachable--;
  const perSide = sizes.map(weight => ({ weight, count: 0 }));
  for (let total = reachable; total > 0;) {
    const index = choices[total];
    perSide[index].count++;
    total -= pairSizes[index];
  }
  return { total: (Math.round(bar * 100) + reachable * 50) / 100, exact: reachable * 50 === load, perSide: perSide.filter(plate => plate.count > 0) };
}
