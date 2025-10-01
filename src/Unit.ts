// src/Unit.ts

export class Unit {
  x: number;
  y: number;
  char: string;
  hp: number;
  team: 'player' | 'enemy';
  godName: string; // Which god this unit belongs to

  rangedStrength: number;
  rangedSpeed: number;
  rangedCooldown: number = 0;

  constructor(
    x: number, y: number, char: string, hp: number, team: 'player' | 'enemy',
    rangedStrength: number, rangedSpeed: number, godName: string
  ) {
    this.x = x;
    this.y = y;
    this.char = char;
    this.hp = hp;
    this.team = team;
    this.rangedStrength = rangedStrength;
    this.rangedSpeed = rangedSpeed;
    this.godName = godName;
  }

  takeDamage(amount: number) {
    this.hp -= amount;
  }
}