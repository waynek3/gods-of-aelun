// src/God.ts

import { type CardTemplate } from './Card';

export type God = {
    name: 'Mesin' | 'Beroan' | 'Tecton' | 'Gul';
    theme: string;
    avatar: CardTemplate;
    // Simple affinities for the MVP
    affinities: {
        positive: 'Mesin' | 'Beroan' | 'Tecton' | 'Gul';
        negative: 'Mesin' | 'Beroan' | 'Tecton' | 'Gul';
    }
}

export const PANTHEON: God[] = [
    {
        name: 'Mesin',
        theme: 'God of Storms and Order',
        avatar: { godName: 'Mesin', name: 'Aspect of Mesin', char: 'Φ', hp: 3, rangedStrength: 1, rangedSpeed: 5 },
        affinities: { positive: 'Tecton', negative: 'Gul' } // Likes Stone, dislikes Whispers
    },
    {
        name: 'Beroan',
        theme: 'God of Wilds and Strength',
        avatar: { godName: 'Beroan', name: 'Aspect of Beroan', char: 'Ψ', hp: 6, rangedStrength: 1, rangedSpeed: 7 },
        affinities: { positive: 'Gul', negative: 'Tecton' } // Likes Whispers, dislikes Stone
    },
    {
        name: 'Tecton',
        theme: 'God of Stone and Fortitude',
        avatar: { godName: 'Tecton', name: 'Aspect of Tecton', char: 'Θ', hp: 8, rangedStrength: 2, rangedSpeed: 9 },
        affinities: { positive: 'Mesin', negative: 'Beroan' } // Likes Storms, dislikes Wilds
    },
    {
        name: 'Gul',
        theme: 'God of Whispers and Decay',
        avatar: { godName: 'Gul', name: 'Aspect of Gul', char: 'Σ', hp: 2, rangedStrength: 2, rangedSpeed: 4 },
        affinities: { positive: 'Beroan', negative: 'Mesin' } // Likes Wilds, dislikes Storms
    }
];