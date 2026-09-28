export type Difficulty = 'easy' | 'medium' | 'hard';
export type DomainKey = 'pattern' | 'numerical' | 'verbal' | 'deductive';
export type AgeGroup = 'u18' | 'a18' | 'a36' | 'a50';

/* ---------- Figures (rendered as inline SVG) ---------- */
export type ShapeKind = 'circle' | 'square' | 'triangle';
export type FillStyle = 'outline' | 'solid' | 'dashed';
export type Quadrant = 'tl' | 'tr' | 'bl' | 'br';
export type LineKind = 'h' | 'v' | 'd1' | 'd2';
export type Count = 1 | 2 | 3;
export type Angle = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

export type Figure =
  | { k: 'shapes'; shape: ShapeKind; n: Count; fill: FillStyle }
  | { k: 'arrow'; a: Angle; d: Count }
  | { k: 'lines'; l: LineKind[] }
  | { k: 'dots'; q: Quadrant[] }
  | { k: 'F'; t: string; desc?: string };

/* ---------- Questions ---------- */
export type Visual =
  | { type: 'matrix'; cells: (Figure | null)[] }
  | { type: 'seq'; items: (number | '?')[] }
  | { type: 'fig'; fig: Figure };

export type Option = { t: string } | { fig: Figure };
export type AnswerIndex = 0 | 1 | 2 | 3;
export type Answer = AnswerIndex | null;

export interface Question {
  id: string;
  domain: DomainKey;
  difficulty: Difficulty;
  prompt: string;
  visual: Visual | null;
  options: readonly [Option, Option, Option, Option];
  answer: AnswerIndex;
  explanation: string;
}

/* ---------- Session & results ---------- */
export interface TestState {
  v: 1;
  status: 'active' | 'done';
  name: string;
  age: AgeGroup;
  startedAt: number;
  deadline: number;
  current: number;
  answers: Answer[];
  flags: boolean[];
}

export interface DomainScore {
  correct: number;
  total: number;
  w: number;
  wc: number;
}

export interface TestResult {
  id: string;
  name: string;
  age: AgeGroup;
  date: number;
  auto: boolean;
  iq: number;
  rawIQ: number;
  percentile: number;
  category: string;
  correct: number;
  total: number;
  W: number;
  Wc: number;
  p: number;
  r: number;
  A: number;
  z: number;
  mu: number;
  sd: number;
  timeUsedMs: number;
  domains: Record<DomainKey, DomainScore>;
  answers: Answer[];
  flags: boolean[];
}
