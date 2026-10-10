export interface ParsedDraw {
  drawId: string;
  date: string;
  numbers: number[];
  bonus: number;
  jackpot1Vnd?: number;
  jackpot2Vnd?: number;
  sourceUrl: string;
}

/** A results source. vietlott.vn is currently the only implementation (see vietlott.ts). */
export interface Source {
  fetchDraws(from: string, to: string): Promise<ParsedDraw[]>;
}
