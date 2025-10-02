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

const FONT_SIZE = 18;
const CHAR_WIDTH = FONT_SIZE * 0.6; // Our mathematical constant for character width
const LINE_HEIGHT = FONT_SIZE;
const SCREEN_WIDTH_CHARS = 42;

export class RenderingEngine {
  private app: HTMLDivElement;
  private svg: SVGSVGElement;

  constructor(app: HTMLDivElement) {
    this.app = app;
    this.app.innerHTML = '';
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('class', 'game-svg');
    this.svg.setAttribute('viewBox', `0 0 ${SCREEN_WIDTH_CHARS * CHAR_WIDTH} 450`);
    this.app.appendChild(this.svg);
  }

  public render(payload: RenderPayload): void {
    let content = '';
    switch (payload.gameState) {
      case 'GOD_SELECTION':
        content = this.renderGodSelection();
        break;
      case 'PRAYER':
        content = this.renderPrayer(payload);
        break;
      case 'CASTING':
        content = this.renderCasting(payload);
        break;
      case 'TRIAL':
        content = this.renderTrial(payload);
        break;
      case 'JUDGEMENT':
        content = this.renderJudgement(payload);
        break;
    }
    this.svg.innerHTML = content;
  }

  /**
   * NEW: Renders a string by creating a separate <text> element for each character.
   * This gives us absolute control over character positioning.
   */
  private createText(text: string, x: number, y: number, className: string): string {
    let svg = '';
    const startX = x * CHAR_WIDTH;
    const yPos = y * LINE_HEIGHT;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      // Skip rendering space characters to keep the SVG clean
      if (char === ' ') {
        continue;
      }
      const charX = startX + (i * CHAR_WIDTH);
      // Using XML-safe characters for < and >
      const safeChar = char.replace('<', '&lt;').replace('>', '&gt;');
      svg += `<text x="${charX}" y="${yPos}" class="${className}" text-rendering="geometricPrecision">${safeChar}</text>`;
    }
    return svg;
  }

private createClickableText(text: string, x: number, y: number, className: string, data: { [key: string]: string }): string {
    const dataAttrs = Object.entries(data).map(([key, value]) => `data-${key}="${value}"`).join(' ');
    
    // Create the visible text elements by rendering each character
    const textElement = this.createText(text, x, y, className);

    // --- START: NEW HITBOX CODE ---
    // Calculate the dimensions of the invisible rectangle
    const rectX = x * CHAR_WIDTH;
    const rectY = (y * LINE_HEIGHT) - (LINE_HEIGHT * 0.8); // Adjust Y to better center the hitbox vertically
    const rectWidth = text.length * CHAR_WIDTH;
    const rectHeight = LINE_HEIGHT;

    // Create the invisible hitbox
    const hitbox = `<rect x="${rectX}" y="${rectY}" width="${rectWidth}" height="${rectHeight}" fill="transparent" />`;
    // ---  END: NEW HITBOX CODE  ---

    // Return the group with the hitbox first, so the text appears on top
    return `<g class="clickable" ${dataAttrs}>${hitbox}${textElement}</g>`;
  }
  private renderGodSelection(): string {
    let svg = '';
    const headerText = "CHOOSE YOUR DEITY";
    svg += this.createText(headerText, (SCREEN_WIDTH_CHARS - headerText.length) / 2, 5, 'header');

    PANTHEON.forEach((god, index) => {
      const buttonText = `[ ${god.name} - ${god.theme} ]`;
      svg += this.createClickableText(buttonText, (SCREEN_WIDTH_CHARS - buttonText.length) / 2, 9 + index * 4, 'button', { action: 'select-god', name: god.name });
    });
    return svg;
  }
  
private renderPrayer(payload: RenderPayload): string {
    let svg = '';
    const headerText = "PRAYER PHASE";
    svg += this.createText(headerText, (SCREEN_WIDTH_CHARS - headerText.length) / 2, 3, 'header');

    const cardPositions = [
        {x: 5, y: 6}, {x: 18, y: 6}, {x: 31, y: 6}, // Top row
        {x: 5, y: 11}, {x: 18, y: 11}, {x: 31, y: 11}, // Middle row
        {x: 18, y: 16} // Bottom row
    ];

    payload.cardsInPrayer.forEach((card, index) => {
        if (index < cardPositions.length) {
            const pos = cardPositions[index];
            const isSelected = payload.selectedPrayerIndices.includes(index);
            const className = isSelected ? 'selected' : '';

            // --- START: THE FIX ---
            // 1. Card text is now 7 characters wide for perfect centering.
            let cardSvg = this.createText('┌─────┐', pos.x, pos.y, className);
            cardSvg += this.createText(`│  ${card.char}  │`, pos.x, pos.y + 1, className);
            cardSvg += this.createText('└─────┘', pos.x, pos.y + 2, className);

            // 2. Hitbox width is increased to 7 characters to match the new card size.
            const hitbox = `<rect x="${pos.x * CHAR_WIDTH}" y="${pos.y * LINE_HEIGHT - LINE_HEIGHT * 0.8}" width="${7 * CHAR_WIDTH}" height="${3 * LINE_HEIGHT}" fill="transparent" />`;
            
            svg += `<g class="clickable" data-action="select-card" data-index="${index}">${hitbox}${cardSvg}</g>`;
            // ---  END: THE FIX  ---
        }
    });

    const aetherText = `Aether: ${payload.playerAether}`;
    const aetherX = (SCREEN_WIDTH_CHARS - aetherText.length) / 2;
    svg += this.createText(aetherText, aetherX, 21, 'ui-text');
    
    const cost = payload.getPrayerCost();
    const prayText = `[ Pray (${cost} Aether) ]`;
    svg += this.createClickableText(prayText, (SCREEN_WIDTH_CHARS - prayText.length) / 2, 23, 'button', { action: 'confirm-prayer' });
    return svg;
  }

private renderCasting(payload: RenderPayload): string {
      let svg = '';
      const headerText = "CASTING PHASE";
      svg += this.createText(headerText, (SCREEN_WIDTH_CHARS - headerText.length) / 2, 3, 'header');

      const boardPositions = [{x:5,y:6},{x:18,y:6},{x:31,y:6},{x:5,y:11},{x:18,y:11},{x:31,y:11}];
      boardPositions.forEach((pos, index) => {
          const card = payload.castingArray[index];
          if (card) {
            // --- THE FIX: Placed card is now 7 characters wide ---
            svg += this.createText('┌─────┐', pos.x, pos.y, 'card');
            svg += this.createText(`│  ${card.char}  │`, pos.x, pos.y + 1, 'card');
            svg += this.createText('└─────┘', pos.x, pos.y + 2, 'card');
          } else {
            // --- THE FIX: Empty slot is now 7 characters wide ---
            svg += this.createClickableText('[     ]', pos.x + 0.5, pos.y + 1.5, 'card-slot', { action: 'select-board-slot', index: `${index}` });
          }
      });
      
      payload.playerHand.forEach((card, index) => {
          const isSelected = payload.selectedHandIndex === index;
          const cardX = 3 + (index * 7);
          const content = `[${card.char}]${isSelected ? '<' : ' '}`;
          const className = isSelected ? 'hand-card selected' : 'hand-card';
          svg += this.createClickableText(content, cardX, 21, className, { action: 'select-hand-card', index: `${index}` });
      });

      if (payload.selectedHandIndex !== null) {
          const sacrificeText = "[ Sacrifice for 1 Aether ]";
          svg += this.createClickableText(sacrificeText, (SCREEN_WIDTH_CHARS - sacrificeText.length) / 2, 19, 'button', { action: 'sacrifice-card' });
      }
      
      const trialText = "[ Begin Trial ]";
      svg += this.createClickableText(trialText, (SCREEN_WIDTH_CHARS - trialText.length) / 2, 23, 'button', { action: 'start-trial' });
      return svg;
  }
  
  private renderJudgement(payload: RenderPayload): string {
      const playerUnits = payload.units.filter(u => u.team === 'player');
      const titleText = playerUnits.length > 0 ? "VICTORY" : "DEFEAT";
      let svg = this.createText(titleText, (SCREEN_WIDTH_CHARS - titleText.length) / 2, 5, 'header');
      
      const buttonText = "[ Click to Continue ]";
      svg += this.createClickableText(buttonText, (SCREEN_WIDTH_CHARS - buttonText.length) / 2, 16, 'button', { action: 'continue' });
      return svg;
  }

  private renderTrial(payload: RenderPayload): string {
    let svg = `<line x1="0" y1="225" x2="${SCREEN_WIDTH_CHARS * CHAR_WIDTH}" y2="225" stroke="#AAAAAA" stroke-width="2"/>`;
    payload.units.forEach(unit => {
        svg += this.createText(unit.char, unit.x, unit.y, 'unit');
    });
    return svg;
  }
}