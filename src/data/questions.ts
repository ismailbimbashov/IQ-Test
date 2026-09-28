import type { Angle, Count, Figure, FillStyle, LineKind, Quadrant, Question, ShapeKind } from '../types';

/* Figure shorthands used by the question bank. */
const S_ = (shape: ShapeKind, n: Count, fill: FillStyle = 'outline'): Figure => ({
  k: 'shapes',
  shape,
  n,
  fill,
});
const AR = (a: Angle, d: Count): Figure => ({ k: 'arrow', a, d });
const LN = (...l: LineKind[]): Figure => ({ k: 'lines', l });
const DT = (...q: Quadrant[]): Figure => ({ k: 'dots', q });
const FF = (t: string, desc: string): Figure => ({ k: 'F', t, desc });

/**
 * The question bank: 20 items, five per domain.
 * visual: matrix (9 cells, null = missing) | seq (items with '?') | fig (single figure)
 * options: exactly four, text or figure; answer: index of the correct option.
 */
export const QUESTIONS: readonly Question[] = [
  // ---------- Pattern recognition ----------
  {
    id: 'p1',
    domain: 'pattern',
    difficulty: 'easy',
    prompt: 'Which tile completes the matrix?',
    visual: {
      type: 'matrix',
      cells: [
        S_('circle', 1),
        S_('circle', 2),
        S_('circle', 3),
        S_('square', 1),
        S_('square', 2),
        S_('square', 3),
        S_('triangle', 1),
        S_('triangle', 2),
        null,
      ],
    },
    options: [
      { fig: S_('triangle', 2) },
      { fig: S_('square', 3) },
      { fig: S_('triangle', 3) },
      { fig: S_('circle', 3) },
    ],
    answer: 2,
    explanation:
      'Each row keeps one shape, and the count rises 1, 2, 3 from left to right. The bottom row is triangles, so the missing tile has three triangles.',
  },

  {
    id: 'p2',
    domain: 'pattern',
    difficulty: 'medium',
    prompt: 'Which tile completes the matrix?',
    visual: {
      type: 'matrix',
      cells: [
        S_('circle', 1),
        S_('square', 1),
        S_('triangle', 1),
        S_('square', 1, 'solid'),
        S_('triangle', 1, 'solid'),
        S_('circle', 1, 'solid'),
        S_('triangle', 1, 'dashed'),
        S_('circle', 1, 'dashed'),
        null,
      ],
    },
    options: [
      { fig: S_('square', 1, 'solid') },
      { fig: S_('circle', 1, 'dashed') },
      { fig: S_('square', 1) },
      { fig: S_('square', 1, 'dashed') },
    ],
    answer: 3,
    explanation:
      'Every row and column contains a circle, square and triangle exactly once, so the gap needs a square. The style is set by the row: outline, solid, dashed. The answer is a dashed square.',
  },

  {
    id: 'p3',
    domain: 'pattern',
    difficulty: 'hard',
    prompt: 'Which tile completes the matrix?',
    visual: {
      type: 'matrix',
      cells: [
        AR(0, 1),
        AR(45, 2),
        AR(90, 3),
        AR(90, 1),
        AR(135, 2),
        AR(180, 3),
        AR(180, 1),
        AR(225, 2),
        null,
      ],
    },
    options: [{ fig: AR(270, 3) }, { fig: AR(225, 3) }, { fig: AR(270, 2) }, { fig: AR(315, 3) }],
    answer: 0,
    explanation:
      'The arrow turns 45° clockwise per column, and each row starts 90° further round than the one above. The dots count the column (1, 2, 3). Bottom-right: 180° + 90° = 270° (pointing left) with three dots.',
  },

  {
    id: 'p4',
    domain: 'pattern',
    difficulty: 'medium',
    prompt: 'Which tile completes the matrix?',
    visual: {
      type: 'matrix',
      cells: [LN('h'), LN('v'), LN('h', 'v'), LN('d1'), LN('d2'), LN('d1', 'd2'), LN('v'), LN('d2'), null],
    },
    options: [
      { fig: LN('v', 'd1') },
      { fig: LN('v', 'd2') },
      { fig: LN('h', 'd2') },
      { fig: LN('h', 'v', 'd2') },
    ],
    answer: 1,
    explanation:
      'The third tile in each row overlays the first two. A vertical line plus a rising diagonal gives the second option.',
  },

  {
    id: 'p5',
    domain: 'pattern',
    difficulty: 'hard',
    prompt: 'Which tile completes the matrix?',
    visual: {
      type: 'matrix',
      cells: [
        DT('tl', 'tr'),
        DT('tr', 'br'),
        DT('tl', 'br'),
        DT('tl', 'bl', 'br'),
        DT('bl'),
        DT('tl', 'br'),
        DT('tr', 'bl'),
        DT('tl', 'tr', 'bl'),
        null,
      ],
    },
    options: [{ fig: DT('tl', 'tr', 'bl') }, { fig: DT('tr') }, { fig: DT('tl', 'br') }, { fig: DT('tl') }],
    answer: 3,
    explanation:
      'The third tile keeps only the dots that appear in exactly one of the first two tiles (dots in both cancel out). In the bottom row, top-right and bottom-left appear in both and cancel, leaving only top-left.',
  },

  // ---------- Numerical ----------
  {
    id: 'n1',
    domain: 'numerical',
    difficulty: 'easy',
    prompt: 'What number comes next?',
    visual: { type: 'seq', items: [3, 7, 11, 15, '?'] },
    options: [{ t: '17' }, { t: '19' }, { t: '21' }, { t: '23' }],
    answer: 1,
    explanation: 'Each term adds 4: 15 + 4 = 19.',
  },

  {
    id: 'n2',
    domain: 'numerical',
    difficulty: 'medium',
    prompt: 'What number comes next?',
    visual: { type: 'seq', items: [2, 6, 12, 20, 30, '?'] },
    options: [{ t: '36' }, { t: '40' }, { t: '42' }, { t: '44' }],
    answer: 2,
    explanation:
      'The gaps grow by 2 each time (+4, +6, +8, +10, +12). Equivalently each term is n × (n + 1): 6 × 7 = 42.',
  },

  {
    id: 'n3',
    domain: 'numerical',
    difficulty: 'medium',
    prompt: 'What number comes next?',
    visual: { type: 'seq', items: [1, 1, 2, 3, 5, 8, 13, '?'] },
    options: [{ t: '18' }, { t: '20' }, { t: '26' }, { t: '21' }],
    answer: 3,
    explanation: 'Each term is the sum of the two before it (Fibonacci): 8 + 13 = 21.',
  },

  {
    id: 'n4',
    domain: 'numerical',
    difficulty: 'hard',
    prompt: 'What number comes next?',
    visual: { type: 'seq', items: [2, 3, 5, 9, 17, '?'] },
    options: [{ t: '33' }, { t: '31' }, { t: '34' }, { t: '35' }],
    answer: 0,
    explanation:
      'Each term is double the previous minus 1: 17 × 2 − 1 = 33. The gaps (1, 2, 4, 8, 16) also double.',
  },

  {
    id: 'n5',
    domain: 'numerical',
    difficulty: 'hard',
    prompt: 'What number comes next?',
    visual: { type: 'seq', items: [4, 9, 25, 49, 121, '?'] },
    options: [{ t: '144' }, { t: '169' }, { t: '196' }, { t: '225' }],
    answer: 1,
    explanation:
      'These are the squares of consecutive primes: 2², 3², 5², 7², 11². The next prime is 13, and 13² = 169.',
  },

  // ---------- Verbal & spatial ----------
  {
    id: 'v1',
    domain: 'verbal',
    difficulty: 'easy',
    prompt: 'Book is to reading as fork is to…',
    visual: null,
    options: [{ t: 'Drawing' }, { t: 'Eating' }, { t: 'Stirring' }, { t: 'Kitchen' }],
    answer: 1,
    explanation: 'The analogy pairs an object with the activity it is used for. A fork is used for eating.',
  },

  {
    id: 'v2',
    domain: 'verbal',
    difficulty: 'medium',
    prompt: 'Which word does not belong with the others?',
    visual: null,
    options: [{ t: 'Apple' }, { t: 'Mango' }, { t: 'Carrot' }, { t: 'Banana' }],
    answer: 2,
    explanation: 'Apple, mango and banana are fruits. A carrot is a root vegetable.',
  },

  {
    id: 'v3',
    domain: 'verbal',
    difficulty: 'medium',
    prompt:
      'An analog clock without numbers shows exactly 3:00. What time does its reflection in a mirror appear to show?',
    visual: null,
    options: [{ t: '3:00' }, { t: '6:00' }, { t: '9:00' }, { t: '12:00' }],
    answer: 2,
    explanation:
      'A mirror flips left and right, so the hour hand pointing at 3 appears to point at 9. For whole hours, the mirrored time is 12:00 minus the real time.',
  },

  {
    id: 'v4',
    domain: 'verbal',
    difficulty: 'hard',
    prompt: 'Which option shows this figure rotated 90° clockwise? (No flipping.)',
    visual: { type: 'fig', fig: FF('', 'spine on the left, arms pointing right, longer arm at the top') },
    options: [
      { fig: FF('rotate(-90 50 50)', 'spine along the bottom, arms pointing up, longer arm on the left') },
      {
        fig: FF(
          'rotate(90 50 50) translate(100 0) scale(-1 1)',
          'spine along the bottom, arms pointing up, longer arm on the right',
        ),
      },
      { fig: FF('rotate(90 50 50)', 'spine along the top, arms pointing down, longer arm on the right') },
      { fig: FF('rotate(180 50 50)', 'spine on the right, arms pointing left, longer arm at the bottom') },
    ],
    answer: 2,
    explanation:
      'A quarter turn clockwise moves the long spine to the top with the arms hanging down on the right. The second option is a mirror image, which no rotation can produce; the first is counter-clockwise and the fourth is a half turn.',
  },

  {
    id: 'v5',
    domain: 'verbal',
    difficulty: 'medium',
    prompt: 'Ocean is to drop as desert is to…',
    visual: null,
    options: [{ t: 'Oasis' }, { t: 'Grain' }, { t: 'Heat' }, { t: 'Camel' }],
    answer: 1,
    explanation:
      'An ocean is made of countless drops of water; a desert is made of countless grains of sand. The relation is whole to smallest unit.',
  },

  // ---------- Deductive ----------
  {
    id: 'd1',
    domain: 'deductive',
    difficulty: 'easy',
    prompt: 'All roses are flowers. Some flowers fade quickly. What follows with certainty?',
    visual: null,
    options: [
      { t: 'Some roses fade quickly.' },
      { t: 'All roses fade quickly.' },
      { t: 'No roses fade quickly.' },
      { t: 'Nothing certain about roses fading.' },
    ],
    answer: 3,
    explanation:
      'The flowers that fade quickly might not include any roses. The premises allow it but do not guarantee it, so nothing about roses fading follows.',
  },

  {
    id: 'd2',
    domain: 'deductive',
    difficulty: 'medium',
    prompt:
      'Anna is taller than Ben. Ben is taller than Cara. Dan is shorter than Cara. Who is the shortest?',
    visual: null,
    options: [{ t: 'Anna' }, { t: 'Ben' }, { t: 'Cara' }, { t: 'Dan' }],
    answer: 3,
    explanation:
      'The order from tallest is Anna, Ben, Cara, Dan. Dan is shorter than Cara, who is shorter than everyone else.',
  },

  {
    id: 'd3',
    domain: 'deductive',
    difficulty: 'medium',
    prompt: 'If it rains, the pavement gets wet. This morning the pavement is dry. What can you conclude?',
    visual: null,
    options: [
      { t: 'It did not rain.' },
      { t: 'It rained lightly.' },
      { t: 'It will rain later.' },
      { t: 'Nothing can be concluded.' },
    ],
    answer: 0,
    explanation: 'If rain guarantees a wet pavement, a dry pavement rules rain out (modus tollens).',
  },

  {
    id: 'd4',
    domain: 'deductive',
    difficulty: 'hard',
    prompt:
      'Three boxes are labelled "Apples", "Oranges" and "Mixed", and every label is wrong. You draw one fruit from the box labelled "Mixed" and get an apple. What is in the box labelled "Oranges"?',
    visual: null,
    options: [{ t: 'Apples' }, { t: 'Mixed fruit' }, { t: 'Oranges' }, { t: 'Cannot be determined' }],
    answer: 1,
    explanation:
      'The "Mixed" box is mislabelled, so it holds one fruit only; you drew an apple, so it holds apples. The "Oranges" box cannot hold oranges (wrong label) or apples (already placed), so it holds the mixed fruit.',
  },

  {
    id: 'd5',
    domain: 'deductive',
    difficulty: 'hard',
    prompt:
      'Each person either always tells the truth or always lies. A says: "B is a liar." B says: "A and I are both liars." What are they?',
    visual: null,
    options: [
      { t: 'Both truth-tellers' },
      { t: 'Both liars' },
      { t: 'A tells the truth, B lies' },
      { t: 'A lies, B tells the truth' },
    ],
    answer: 2,
    explanation:
      'B cannot be truthful, since a truth-teller would never call themselves a liar. So B lies, meaning "both are liars" is false, so A is truthful. A\'s claim that B is a liar checks out.',
  },
];
