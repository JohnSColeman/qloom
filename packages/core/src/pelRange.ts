/**
 * The Tapestry `from..to` range operator: an inclusive integer sequence,
 * ascending or descending. Tapestry produces an `IntegerRange`; an array is the
 * faithful, iterable browser equivalent (used as a `Loop`/`Grid` source).
 */
export function pelRange(from: number, to: number): number[] {
  const result: number[] = [];
  if (from <= to) for (let i = from; i <= to; i++) result.push(i);
  else for (let i = from; i >= to; i--) result.push(i);
  return result;
}
