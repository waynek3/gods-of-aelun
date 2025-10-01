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

const SCREEN_WIDTH_CHARS = 42;

export class RenderingEngine {
  private app: HTMLDivElement;

  constructor(app: HTMLDivElement) {
    this.app = app;
  }

  public render(payload: RenderPayload) {
    let innerHtml = '';
    switch (payload.gameState) {
      case 'GOD_SELECTION':
        innerHtml = this.renderGodSelection();
        break;
      case 'PRAYER':
        innerHtml = this.renderPrayer(payload);
        break;
      case 'CASTING':
        innerHtml = this.renderCasting(payload);
        break;
      case 'TRIAL':
        innerHtml = this.renderTrial(payload);
        break;
      case 'JUDGEMENT':
        innerHtml = this.renderJudgement(payload);
        break;
    }
    this.app.innerHTML = `<div class="game-container">${innerHtml}</div>`;
  }

  private renderGodSelection(): string {
    let html = '';
    const headerText = "CHOOSE YOUR DEITY";
    const headerX = Math.floor((SCREEN_WIDTH_CHARS - headerText.length) / 2);
    html += `<div class="header" style="grid-row: 5; grid-column: ${headerX + 1} / span ${headerText.length};">${headerText}</div>`;

    PANTHEON.forEach((god, index) => {
      const y = 8 + (index * 4);
      const buttonText = `[ ${god.name} - ${god.theme} ]`;
      const buttonX = Math.floor((SCREEN_WIDTH_CHARS - buttonText.length) / 2);
      html += `<div class="clickable button" data-action="select-god" data-name="${god.name}" style="grid-row: ${y + 1}; grid-column: ${buttonX + 1} / span ${buttonText.length};">${buttonText}</div>`;
    });
    return html;
  }
  
  private renderPrayer(payload: RenderPayload): string {
    let html = '';
    const headerText = "PRAYER PHASE";
    const headerX = Math.floor((SCREEN_WIDTH_CHARS - headerText.length) / 2);
    html += `<div class="header" style="grid-row: 5; grid-column: ${headerX + 1} / span ${headerText.length};">${headerText}</div>`;

    const cardPositions = [{x: 5, y: 8}, {x: 18, y: 8}, {x: 31, y: 8}, {x: 5, y: 13}, {x: 18, y: 13}, {x: 31, y: 13}, {x: 18, y: 18}];
    payload.cardsInPrayer.forEach((card, index) => {
        const pos = cardPositions[index];
        const isSelected = payload.selectedPrayerIndices.includes(index);
        html += `<div class="clickable card ${isSelected ? 'selected' : ''}" data-action="select-card" data-index="${index}" style="grid-row: ${pos.y + 1} / span 3; grid-column: ${pos.x + 1} / span 6;">
            <pre>┌────┐\n│  ${card.char} │\n└────┘</pre>
        </div>`;
    });

    const cost = payload.getPrayerCost();
    const buttonText = `[ Pray (${cost} Aether) ]`;
    const aetherText = `Aether: ${payload.playerAether}`;
    html += `<div class="ui-text" style="grid-row: 21; grid-column: 4 / span ${aetherText.length};">${aetherText}</div>`;
    const buttonX = Math.floor((SCREEN_WIDTH_CHARS - buttonText.length) / 2);
    html += `<div class="clickable button" id="pray-button" data-action="confirm-prayer" style="grid-row: 23; grid-column: ${buttonX + 1} / span ${buttonText.length};">${buttonText}</div>`;

    return html;
  }

  private renderCasting(payload: RenderPayload): string {
      let html = '';
      const headerText = "CASTING PHASE";
      const headerX = Math.floor((SCREEN_WIDTH_CHARS - headerText.length) / 2);
      html += `<div class="header" style="grid-row: 5; grid-column: ${headerX + 1} / span ${headerText.length};">${headerText}</div>`;

      const boardPositions = [{x:5,y:8},{x:18,y:8},{x:31,y:8},{x:5,y:13},{x:18,y:13},{x:31,y:13}];
      boardPositions.forEach((pos, index) => {
          const card = payload.castingArray[index];
          const content = card ? `<pre>┌────┐\n│  ${card.char} │\n└────┘</pre>` : '[    ]';
          html += `<div class="clickable card-slot" data-action="select-board-slot" data-index="${index}" style="grid-row: ${pos.y + 1} / span 3; grid-column: ${pos.x + 1} / span 6;">${content}</div>`;
      });
      
      payload.playerHand.forEach((card, index) => {
          const isSelected = payload.selectedHandIndex === index;
          const cardX = 3 + (index * 7);
          const content = `[${card.char}]${isSelected ? '<' : ' '}`;
          html += `<div class="clickable hand-card ${isSelected ? 'selected' : ''}" data-action="select-hand-card" data-index="${index}" style="grid-row: 21; grid-column: ${cardX + 1} / span ${content.length};">${content}</div>`;
      });

      if (payload.selectedHandIndex !== null) {
          const sacrificeText = "[ Sacrifice for 1 Aether ]";
          const sacrificeX = Math.floor((SCREEN_WIDTH_CHARS - sacrificeText.length) / 2);
          html += `<div class="clickable button" data-action="sacrifice-card" style="grid-row: 19; grid-column: ${sacrificeX + 1} / span ${sacrificeText.length};">${sacrificeText}</div>`;
      }
      
      const buttonText = "[ Begin Trial ]";
      const buttonX = Math.floor((SCREEN_WIDTH_CHARS - buttonText.length) / 2);
      html += `<div class="clickable button" data-action="start-trial" style="grid-row: 23; grid-column: ${buttonX + 1} / span ${buttonText.length};">${buttonText}</div>`;

      return html;
  }
  
  private renderJudgement(payload: RenderPayload): string {
      const playerUnits = payload.units.filter(u => u.team === 'player');
      const titleText = playerUnits.length > 0 ? "VICTORY" : "DEFEAT";
      const headerX = Math.floor((SCREEN_WIDTH_CHARS - titleText.length) / 2);
      let html = `<div class="header" style="grid-row: 5; grid-column: ${headerX + 1} / span ${titleText.length};">${titleText}</div>`;
      
      const buttonText = "[ Click to Continue ]";
      const buttonX = Math.floor((SCREEN_WIDTH_CHARS - buttonText.length) / 2);
      html += `<div class="clickable button" data-action="continue" style="grid-row: 16; grid-column: ${buttonX + 1} / span ${buttonText.length};">${buttonText}</div>`;
      
      return html;
  }

  private renderTrial(payload: RenderPayload): string {
    let html = '';
    html += `<div class="center-line" style="grid-row: 13; grid-column: 2 / span 40;">${'─'.repeat(40)}</div>`
    payload.units.forEach(unit => {
        // We add 1 because CSS grid rows/columns are 1-based, not 0-based
        html += `<div class="unit" style="grid-row: ${unit.y + 1}; grid-column: ${unit.x + 1};">${unit.char}</div>`;
    });
    return html;
  }
}