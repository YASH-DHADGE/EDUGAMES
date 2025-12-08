export interface Clue {
    id: string;
    text: string;
    equation: string; // The math problem to solve
    answer: number;   // The numeric answer
    variable: string; // The variable solved for (e.g., 'x', 'y')
    dependsOn?: string; // ID of a clue that must be solved first (provides a value)
    solved: boolean;
    type: 'linear' | 'system' | 'quadratic';
    hint: string;
}

export interface Villain {
    id: string;
    name: string;
    description: string;
    patternDescription: string;
    image?: string; // Placeholder for now
}

export interface Case {
    id: string;
    title: string;
    description: string; // The "Crime"
    location: { x: number, y: number }; // For map placement (0-100 coordinates)
    difficulty: 1 | 2 | 3 | 4 | 5;
    clues: Clue[];
    villainId: string;
    requiredStarsToUnlock: number;
}

export const VILLAINS: Villain[] = [
    {
        id: 'v_calc',
        name: 'The Calculator',
        description: 'Obsessed with the number 5. Leaves trails of multiples.',
        patternDescription: 'Look for equations where everything sums to multiples of 5.'
    },
    {
        id: 'v_dist',
        name: 'The Distributor',
        description: 'Loves to hide things inside parentheses.',
        patternDescription: 'Always uses distribution properties (e.g., 3(x+2)).'
    },
    {
        id: 'v_frac',
        name: 'The Rational',
        description: 'Splits everything into pieces. Fractions are his signature.',
        patternDescription: 'Equations always involve denominators.'
    },
    {
        id: 'v_zero',
        name: 'Agent Zero',
        description: 'Believes in nothing. Everything must equal zero.',
        patternDescription: 'Uses quadratic equations equal to 0.'
    }
];

export const CASES: Case[] = [
    {
        id: 'case_1',
        title: 'The Missing Pizza Slice',
        description: 'A pizza shop was robbed. The thief left calculations on the receipt paper.',
        location: { x: 20, y: 80 },
        difficulty: 1,
        villainId: 'v_calc',
        requiredStarsToUnlock: 0,
        clues: [
            {
                id: 'c1_1',
                text: 'The thief ordered x slices. Total cost was $15 at $3 per slice.',
                equation: '3x = 15',
                answer: 5,
                variable: 'x',
                solved: false,
                type: 'linear',
                hint: 'Divide both sides by 3.'
            },
            {
                id: 'c1_2',
                text: 'Find the time (t) the thief left. It relates to the slices (x).',
                equation: 't + x = 17',
                answer: 12,
                variable: 't',
                dependsOn: 'c1_1',
                solved: false,
                type: 'linear',
                hint: 'Substitute x with the value you found in the first clue.'
            },
            {
                id: 'c1_3',
                text: 'The getaway car speed (s) calculation.',
                equation: 's - 20 = 25',
                answer: 45,
                variable: 's',
                solved: false,
                type: 'linear',
                hint: 'Add 20 to both sides.'
            }
        ]
    },
    {
        id: 'case_2',
        title: 'The Parenthetical Plot',
        description: 'A bank vault was breached using a code distributed across several lockets.',
        location: { x: 40, y: 60 },
        difficulty: 2,
        villainId: 'v_dist',
        requiredStarsToUnlock: 1,
        clues: [
            {
                id: 'c2_1',
                text: 'First digit (a) is hidden in this note.',
                equation: '2(a + 3) = 16',
                answer: 5,
                variable: 'a',
                solved: false,
                type: 'linear',
                hint: 'Distribute the 2 first: 2a + 6 = 16.'
            },
            {
                id: 'c2_2',
                text: 'Second digit (b) depends on the first (a).',
                equation: '3(b - a) = 9',
                answer: 8,
                variable: 'b',
                dependsOn: 'c2_1',
                solved: false,
                type: 'linear',
                hint: 'Plug in the value of a, then solve.'
            },
            {
                id: 'c2_3',
                text: 'The vault number (v) equation.',
                equation: '5(v + 1) = 55',
                answer: 10,
                variable: 'v',
                solved: false,
                type: 'linear',
                hint: 'Divide by 5 first to simplify.'
            }
        ]
    },
    {
        id: 'case_3',
        title: 'Fractional Fraud',
        description: 'The stock market crash was triggered by a specific algorithm.',
        location: { x: 70, y: 40 },
        difficulty: 3,
        villainId: 'v_frac',
        requiredStarsToUnlock: 1,
        clues: [
            {
                id: 'c3_1',
                text: 'Start with the base value (n).',
                equation: 'n / 4 = 12',
                answer: 48,
                variable: 'n',
                solved: false,
                type: 'linear',
                hint: 'Multiply both sides by 4.'
            },
            {
                id: 'c3_2',
                text: 'Find the modifier (m) using base (n).',
                equation: '(m + n) / 2 = 30',
                answer: 12,
                variable: 'm',
                dependsOn: 'c3_1',
                solved: false,
                type: 'linear',
                hint: 'Substitute n first.'
            }
        ]
    },
    // Placeholder cases to fill the map (logic can be duplcated or simplified for MVP demo)
    ...Array.from({ length: 22 }).map((_, i) => ({
        id: `case_${i + 4}`,
        title: `Cold Case #${i + 4}`,
        description: 'A mysterious unsolved file.',
        location: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
        difficulty: 3 as const,
        villainId: 'v_zero',
        requiredStarsToUnlock: i + 3, // Requires substantial progress
        clues: [
            {
                id: `c${i + 4}_1`,
                text: 'Solve for x.',
                equation: '2x = 10',
                answer: 5,
                variable: 'x',
                solved: false,
                type: 'linear' as const,
                hint: 'Divide by 2.'
            }
        ]
    }))
];
