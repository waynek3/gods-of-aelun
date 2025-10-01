// src/Card.ts

export type CardTemplate = {
  godName: 'Mesin' | 'Beroan' | 'Tecton' | 'Gul'; // Which god this card belongs to
  name: string;
  char: string;
  hp: number;
  rangedStrength: number;
  rangedSpeed: number;
}

export const DECK: CardTemplate[] = [
  { godName: 'Mesin', name: 'Lightning', char: 'L', hp: 1, rangedStrength: 1, rangedSpeed: 3 },
  { godName: 'Beroan', name: 'Wyrm', char: 'W', hp: 5, rangedStrength: 1, rangedSpeed: 6 },
  { godName: 'Tecton', name: 'Golem', char: 'G', hp: 8, rangedStrength: 2, rangedSpeed: 8 },
  { godName: 'Gul', name: 'Specter', char: 'S', hp: 3, rangedStrength: 2, rangedSpeed: 4 },
];