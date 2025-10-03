// src/Unit.ts

export class Unit {
  x: number;
  y: number;
  char: string;
  hp: number;
  team: 'player' | 'enemy';
  godName: string; // Which god this unit belongs to
  isAvatar: boolean; // NEW: Flag to identify the Avatar unit

  rangedStrength: number;
  rangedSpeed: number;
  rangedCooldown: number = 0;

  constructor(
    x: number, y: number, char: string, hp: number, team: 'player' | 'enemy',
    rangedStrength: number, rangedSpeed: number, godName: string,
    isAvatar: boolean = false // NEW: Add isAvatar to constructor
  ) {
    this.x = x;
    this.y = y;
    this.char = char;
    this.hp = hp;
    this.team = team;
    this.rangedStrength = rangedStrength;
    this.rangedSpeed = rangedSpeed;
    this.godName = godName;
    this.isAvatar = isAvatar; // NEW: Assign the isAvatar flag
  }

  takeDamage(amount: number) {
    this.hp -= amount;
  }
}