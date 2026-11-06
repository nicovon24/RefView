import { lawDepth1to8 } from './law-depth-1-8';
import { lawDepth9to17 } from './law-depth-9-17';
import type { LawDepth } from './law-depth-contract';

export const lawDepth202627: readonly LawDepth[] = [...lawDepth1to8, ...lawDepth9to17];

export function getLawDepth(number: number): LawDepth {
  const law = lawDepth202627[number - 1];
  if (!law || law.number !== number) throw new Error(`Missing Law ${number} depth`);
  return law;
}
