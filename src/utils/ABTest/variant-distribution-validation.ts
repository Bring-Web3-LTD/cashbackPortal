// --- Compile-time validation that variant weights sum to exactly 100 ---
type BuildTuple<N extends number, R extends unknown[] = []> =
  R['length'] extends N ? R : BuildTuple<N, [...R, unknown]>

type SumWeights<T extends readonly (readonly [string, number])[]> =
  T extends readonly [readonly [string, infer N extends number], ...infer Rest extends readonly (readonly [string, number])[]]
    ? [...BuildTuple<N>, ...SumWeights<Rest>]
    : []

type ValidateSum100<T extends readonly (readonly [string, number])[]> =
  SumWeights<T>['length'] extends 100 ? T : never

/** Define a variant distribution. TypeScript will error if weights don't sum to 100. */
export function createDistribution<const T extends readonly (readonly [string, number])[]>(
  entries: ValidateSum100<T>
): { [K in T[number][0]]: number } {
  return Object.fromEntries(entries) as never
}

export type VariantDistribution = { [variant: string]: number }
export type VariantsConfig = { [platformName: string]: VariantDistribution }
