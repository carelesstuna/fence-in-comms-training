/**
 * Daten für den Leseseiten-Baustein ::chart{kind=… airfield=… freqs=…}.
 */
import type { VarSpec } from '../content/schema'
import { resolveVars, type ResolveEnv } from '../random/vars'
import type { ChartData, ChartKind } from './chart'

export function resolveChartBlock(kind: ChartKind, airfieldId: string | undefined, freqs: 'sim' | 'real', env: ResolveEnv): ChartData {
  const specs: Record<string, VarSpec> = {
    af: airfieldId ? { pool: 'airfields', where: { id: airfieldId } } : { pool: 'airfields' },
    cp: { commplan: true, airfield: 'af' },
    c: { chart: kind, airfield: 'af', commplan: 'cp', freqs },
  }
  return resolveVars(specs, env).c.data as ChartData
}
