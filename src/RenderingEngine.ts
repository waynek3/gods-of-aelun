// src/RenderingEngine.ts

import { Unit } from './Unit';
import { type CardTemplate } from './Card';
import { type GamePhase } from './types';
import { PANTHEON, type God } from './God';

export interface RenderPayload {
  gameState: GamePhase;
  chosenGod: God | null;
  playerAether: number;
  units: Unit[];
  playerHand: CardTemplate[];
  cardsInPrayer: CardTemplate[];
  selectedPrayerIndices: number[];
  castingArray: (CardTemplate | null)[];
  selectedHandIndex: number | null;
  getPrayerCost: () => number;
}

const SCREEN_WIDTH = 42;
const SCREEN_HEIGHT = 24;
const CENTER_LINE = 12;
const CHAR_PIXEL_WIDTH = 10;
const CHAR_PIXEL_HEIGHT = 18;

export class RenderingEngine {
  private app: HTMLDivElement;

  constructor(app: HTMLDivElement) {
    this.app = app;
  }

  public render(payload: RenderPayload) {
    let backgroundGrid = this.createBaseGrid();
    let interactiveHtml = '';
    const gameState = payload.gameState;

    switch (gameState) {
      case 'GOD_SELECTION':
        const godData = this.renderGodSelection(backgroundGrid);
        backgroundGrid = godData.grid;
        interactiveHtml = godData.html;
        break;
      case 'PRAYER':
        const prayerData = this.renderPrayer(backgroundGrid, payload);
        backgroundGrid = prayerData.grid;
        interactiveHtml = prayerData.html;
        break;
      case 'CASTING':
        const castingData = this.renderCasting(backgroundGrid, payload);
        backgroundGrid = castingData.grid;
        interactiveHtml = castingData.html;
        break;
      case 'TRIAL':
         backgroundGrid = this.renderTrial(backgroundGrid, payload);
         break;
      case 'JUDGEMENT':
         const judgementData = this.renderJudgement(backgroundGrid, payload);
         backgroundGrid = judgementData.grid;
         interactiveHtml = judgementData.html;
         break;
    }
    
    if (gameState !== 'TRIAL' && Math.random() < 0.05) {
        this.applyGlitchEffect(backgroundGrid);
    }

    const preContent = backgroundGrid.map(row => row.join('')).join('\n');
    this.app.innerHTML = `<div class="game-container">
        <div class="game-background">${preContent}</div>
        ${interactiveHtml}
    </div>`;
  }

  private createBaseGrid(): string[][] {
    const grid = Array.from({ length: SCREEN_HEIGHT }, () => Array(SCREEN_WIDTH).fill(' '));
    for (let y = 0; y < SCREEN_HEIGHT; y++) {
      for (let x = 0; x < SCREEN_WIDTH; x++) {
        if ((y === 0 || y === SCREEN_HEIGHT - 1) || (x === 0 || x === SCREEN_WIDTH - 1)) grid[y][x] = '▒';
        if ((y === 1 || y === SCREEN_HEIGHT - 2) && x > 0 && x < SCREEN_WIDTH - 1) grid[y][x] = ' ';
        if ((x === 1 || x === SCREEN_WIDTH - 2) && y > 0 && y < SCREEN_HEIGHT - 1) grid[y][x] = ' ';
      }
    }
    return grid;
  }

  private drawAsciiHeader(grid: string[][], text: string) {
    const headerTop = `╔═${"═".repeat(text.length)}═╗`;
    const headerMid = `║ ${text} ║`;
    const headerBot = `╚═${"═".repeat(text.length)}═╝`;
    const startX = Math.floor((SCREEN_WIDTH - headerMid.length) / 2);
    grid[3].splice(startX, headerTop.length, ...headerTop.split(''));
    grid[4].splice(startX, headerMid.length, ...headerMid.split(''));
    grid[5].splice(startX, headerBot.length, ...headerBot.split(''));
  }

  private applyGlitchEffect(grid: string[][]) {
    const glitchChars = ['#', '%', '$', '?', '!', '0', '1', '▓', '▒', '░'];
    const glitches = Math.floor(Math.random() * 15) + 5;
    for (let i = 0; i < glitches; i++) {
      const x = Math.floor(Math.random() * SCREEN_WIDTH);
      const y = Math.floor(Math.random() * SCREEN_HEIGHT);
      if (grid[y] && grid[y][x] === ' ') {
        grid[y][x] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
    }
  }

  private renderGodSelection(grid: string[][]): { grid: string[][], html: string } {
    this.drawAsciiHeader(grid, "CHOOSE YOUR DEITY");
    let html = '';
    const godPositions = [{y: 8}, {y: 12}, {y: 16}, {y: 20}];
    PANTHEON.forEach((god, index) => {
        const pos = godPositions[index];
        const buttonText = `[ ${god.name.padEnd(8, ' ')} - ${god.theme} ]`;
        const buttonX = Math.floor((SCREEN_WIDTH - buttonText.length) / 2);
        grid[pos.y].splice(buttonX, buttonText.length, ...buttonText.split(''));
        html += `<div class="clickable" style="top: ${pos.y * CHAR_PIXEL_HEIGHT}px; left: ${buttonX * CHAR_PIXEL_WIDTH}px; width: ${buttonText.length * CHAR_PIXEL_WIDTH}px; height: ${CHAR_PIXEL_HEIGHT}px;" data-action="select-god" data-name="${god.name}"></div>`;
    });
    return { grid, html };
  }

  private renderPrayer(grid: string[][], payload: RenderPayload): { grid: string[][], html: string } {
    this.drawAsciiHeader(grid, "PRAYER PHASE");
    let html = '';
    const cardPositions = [{x: 5, y: 9}, {x: 18, y: 9}, {x: 31, y: 9}, {x: 5, y: 15}, {x: 18, y: 15}, {x: 31, y: 15}, {x: 18, y: 21}];
    payload.cardsInPrayer.forEach((card, index) => {
        const pos = cardPositions[index];
        const isSelected = payload.selectedPrayerIndices.includes(index);
        grid[pos.y-1].splice(pos.x, 6, ...'┌────┐'.split(''));
        grid[pos.y].splice(pos.x, 6, ...`│  ${card.char} │`.split(''));
        grid[pos.y+1].splice(pos.x, 6, ...'└────┘'.split(''));
        html += `<div class="clickable card-button ${isSelected ? 'selected' : ''}" style="top: ${(pos.y - 1) * CHAR_PIXEL_HEIGHT}px; left: ${pos.x * CHAR_PIXEL_WIDTH}px;" data-action="select-card" data-index="${index}"></div>`;
    });
    const cost = payload.getPrayerCost();
    const buttonText = `[ Pray (${cost} Aether) ]`;
    const aetherText = `Aether: ${payload.playerAether}`;
    grid[SCREEN_HEIGHT - 6].splice(3, aetherText.length, ...aetherText.split(''));
    const buttonX = Math.floor((SCREEN_WIDTH - buttonText.length) / 2);
    grid[SCREEN_HEIGHT - 4].splice(buttonX, buttonText.length, ...buttonText.split(''));
    html += `<div class="clickable pray-button" style="top: ${(SCREEN_HEIGHT - 4) * CHAR_PIXEL_HEIGHT}px; left: ${buttonX * CHAR_PIXEL_WIDTH}px;" data-action="confirm-prayer"></div>`;
    return { grid, html };
  }

  private renderCasting(grid: string[][], payload: RenderPayload): { grid: string[][], html: string } {
      this.drawAsciiHeader(grid, "CASTING PHASE");
      let html = '';
      const aetherText = `Aether: ${payload.playerAether}`;
      grid[18].splice(3, aetherText.length, ...aetherText.split(''));
      const boardPositions = [{x:5,y:8},{x:18,y:8},{x:31,y:8},{x:5,y:13},{x:18,y:13},{x:31,y:13}];
      boardPositions.forEach((pos, index) => {
          const card = payload.castingArray[index];
          if (card) {
              grid[pos.y-1].splice(pos.x, 6, ...'┌────┐'.split(''));
              grid[pos.y].splice(pos.x, 6, ...`│  ${card.char} │`.split(''));
              grid[pos.y+1].splice(pos.x, 6, ...'└────┘'.split(''));
          } else {
              grid[pos.y].splice(pos.x, 6, ...'[    ]'.split(''));
              html += `<div class="clickable" style="top: ${(pos.y-1) * CHAR_PIXEL_HEIGHT}px; left: ${pos.x * CHAR_PIXEL_WIDTH}px; width: ${6 * CHAR_PIXEL_WIDTH}px; height: ${3 * CHAR_PIXEL_HEIGHT}px;" data-action="select-board-slot" data-index="${index}"></div>`;
          }
      });
      payload.playerHand.forEach((card, index) => {
          const isSelected = payload.selectedHandIndex === index;
          const cardX = 3 + (index * 7);
          grid[20].splice(cardX, 6, ...`[${card.char}]${isSelected ? '<' : ' '}`.split(''));
          html += `<div class="clickable" style="top: ${20 * CHAR_PIXEL_HEIGHT}px; left: ${cardX * CHAR_PIXEL_WIDTH}px; width: ${3 * CHAR_PIXEL_WIDTH}px; height: ${1 * CHAR_PIXEL_HEIGHT}px;" data-action="select-hand-card" data-index="${index}"></div>`;
      });
      if (payload.selectedHandIndex !== null) {
          const sacrificeText = "[ Sacrifice for 1 Aether ]";
          const sacrificeX = Math.floor((SCREEN_WIDTH - sacrificeText.length) / 2);
          grid[18].splice(sacrificeX, sacrificeText.length, ...sacrificeText.split(''));
          html += `<div class="clickable" style="top: ${18 * CHAR_PIXEL_HEIGHT}px; left: ${sacrificeX * CHAR_PIXEL_WIDTH}px; width: ${sacrificeText.length * CHAR_PIXEL_WIDTH}px; height: ${1 * CHAR_PIXEL_HEIGHT}px;" data-action="sacrifice-card"></div>`;
      }
      const buttonText = "[ Begin Trial ]";
      const buttonX = Math.floor((SCREEN_WIDTH - buttonText.length) / 2);
      grid[22].splice(buttonX, buttonText.length, ...buttonText.split(''));
      html += `<div class="clickable" style="top: ${22 * CHAR_PIXEL_HEIGHT}px; left: ${buttonX * CHAR_PIXEL_WIDTH}px; width: ${buttonText.length * CHAR_PIXEL_WIDTH}px; height: ${1 * CHAR_PIXEL_HEIGHT}px;" data-action="start-trial"></div>`;
      return { grid, html };
  }
  
  private renderJudgement(grid: string[][], payload: RenderPayload): { grid: string[][], html: string } {
      const playerUnits = payload.units.filter(u => u.team === 'player');
      const titleText = playerUnits.length > 0 ? "VICTORY" : "DEFEAT";
      this.drawAsciiHeader(grid, titleText);
      const buttonText = "[ Click to Continue ]";
      const buttonX = Math.floor((SCREEN_WIDTH - buttonText.length) / 2);
      grid[15].splice(buttonX, buttonText.length, ...buttonText.split(''));
      const html = `<div class="clickable" style="top: ${15 * CHAR_PIXEL_HEIGHT}px; left: ${buttonX * CHAR_PIXEL_WIDTH}px; width: ${buttonText.length * CHAR_PIXEL_WIDTH}px; height: ${1 * CHAR_PIXEL_HEIGHT}px;" data-action="continue"></div>`;
      return { grid, html };
  }

  private renderTrial(grid: string[][], payload: RenderPayload): string[][] {
      grid[CENTER_LINE] = Array(SCREEN_WIDTH).fill('─');
      grid[CENTER_LINE][1] = '▒'; grid[CENTER_LINE][SCREEN_WIDTH-2] = '▒';
      for (const unit of payload.units) {
          if (grid[unit.y] && grid[unit.y][unit.x]) {
              grid[unit.y][unit.x] = unit.char;
          }
      }
      return grid;
  }
}