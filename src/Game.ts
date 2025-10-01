// src/Game.ts

import { Unit } from './Unit';
import { type CardTemplate, DECK } from './Card';
import { RenderingEngine, type RenderPayload } from './RenderingEngine';
import { CombatEngine } from './CombatEngine';
import type { GamePhase } from './types';
import { type God, PANTHEON } from './God';

export class Game {
    private gameState: GamePhase = 'GOD_SELECTION';
    public chosenGod: God | null = null;
    public playerAether: number = 10;
    public units: Unit[] = [];
    public playerHand: CardTemplate[] = [];
    public cardsInPrayer: CardTemplate[] = [];
    public selectedPrayerIndices: number[] = [];
    public castingArray: (CardTemplate | null)[] = Array(6).fill(null);
    public selectedHandIndex: number | null = null;
    
    private renderer: RenderingEngine;
    private combat: CombatEngine;

    constructor(app: HTMLDivElement) {
        this.renderer = new RenderingEngine(app);
        this.combat = new CombatEngine();
        
        ['click', 'touchend'].forEach(eventType => {
            app.addEventListener(eventType, (e) => this.handleInput(e as MouseEvent | TouchEvent));
        });
    }

    public start() {
        setInterval(() => this.tick(), 100);
        this.render();
    }

    private tick() {
        if (this.gameState === 'TRIAL') {
            this.units = this.combat.updateTrial(this.units);
            this.render();
            if (!this.units.some(u => u.team === 'player') || !this.units.some(u => u.team === 'enemy')) {
                this.gameState = 'JUDGEMENT';
                this.render();
            }
        }
    }
    
    private render() {
        const payload: RenderPayload = {
            gameState: this.gameState,
            chosenGod: this.chosenGod,
            playerAether: this.playerAether,
            units: this.units,
            playerHand: this.playerHand,
            cardsInPrayer: this.cardsInPrayer,
            selectedPrayerIndices: this.selectedPrayerIndices,
            castingArray: this.castingArray,
            selectedHandIndex: this.selectedHandIndex,
            getPrayerCost: this.getPrayerCost,
        };
        this.renderer.render(payload);
    }
    
    // UPDATED: This is the new, simpler input handler.
    private handleInput(e: MouseEvent | TouchEvent) {
        e.preventDefault();
        const target = e.target as HTMLElement;
        // We find the closest parent with a data-action, to handle clicks on inner elements
        const clickable = target.closest('[data-action]') as HTMLElement | null;
        if (!clickable) return;

        const { action, index, name } = clickable.dataset;

        switch (this.gameState) {
            case 'GOD_SELECTION':
                if (action === 'select-god') {
                    this.chosenGod = PANTHEON.find(g => g.name === name) || null;
                    if (this.chosenGod) this.enterPrayerPhase();
                }
                break;
            case 'PRAYER':
                if (action === 'select-card' && index) {
                    const cardIndex = parseInt(index);
                    if (this.selectedPrayerIndices.includes(cardIndex)) {
                        this.selectedPrayerIndices = this.selectedPrayerIndices.filter(i => i !== cardIndex);
                    } else {
                        this.selectedPrayerIndices.push(cardIndex);
                    }
                } else if (action === 'confirm-prayer') {
                    this.confirmPrayerSelection();
                }
                break;
            case 'CASTING':
                if (action === 'select-hand-card' && index) {
                    const cardIndex = parseInt(index);
                    this.selectedHandIndex = this.selectedHandIndex === cardIndex ? null : cardIndex;
                } else if (action === 'select-board-slot' && index) {
                    this.placeCardInSlot(parseInt(index));
                } else if (action === 'sacrifice-card') {
                    this.sacrificeSelectedCard();
                } else if (action === 'start-trial') {
                    this.startNewTrial();
                }
                break;
            case 'JUDGEMENT':
                if (action === 'continue') {
                    this.enterPrayerPhase();
                }
                break;
        }

        this.render();
    }

    private getPrayerCost = (): number => {
        const costs = [1, 3, 5, 8, 13, 21, 34];
        let totalCost = 0;
        for (let i = 0; i < this.selectedPrayerIndices.length; i++) {
            totalCost += costs[i] || 0;
        }
        return totalCost;
    };

    private enterPrayerPhase() {
        this.gameState = 'PRAYER';
        this.selectedPrayerIndices = [];
        this.cardsInPrayer = [];
        for (let i = 0; i < 7; i++) {
            this.cardsInPrayer.push(DECK[Math.floor(Math.random() * DECK.length)]);
        }
    }

    private confirmPrayerSelection() {
        const cost = this.getPrayerCost();
        if (this.playerAether < cost) return;
        this.playerAether -= cost;
        const selectedCards = this.selectedPrayerIndices.sort((a,b) => a - b).map(i => this.cardsInPrayer[i]);
        this.playerHand.push(...selectedCards);
        this.gameState = 'CASTING';
    }

    private placeCardInSlot(slotIndex: number) {
        if (this.selectedHandIndex !== null && this.playerHand[this.selectedHandIndex]) {
            if (this.castingArray[slotIndex] === null) {
                const cardToPlace = this.playerHand.splice(this.selectedHandIndex, 1)[0];
                this.castingArray[slotIndex] = cardToPlace;
                this.selectedHandIndex = null;
            }
        }
    }

    private sacrificeSelectedCard() {
        if (this.selectedHandIndex !== null && this.playerHand[this.selectedHandIndex]) {
            this.playerHand.splice(this.selectedHandIndex, 1);
            this.playerAether += 1;
            this.selectedHandIndex = null;
        }
    }

    private startNewTrial() {
        this.units = [];
        const tempUnitList: Unit[] = [];
        if (this.chosenGod) {
            const avatar = this.chosenGod.avatar;
            tempUnitList.push(new Unit(18, 18, avatar.char, avatar.hp, 'player', avatar.rangedStrength, avatar.rangedSpeed, avatar.godName));
        }
        this.castingArray.forEach((card, index) => {
            if (card) {
                const x = (index % 3) * 13 + 5;
                const y = (Math.floor(index / 3)) * 5 + 15;
                tempUnitList.push(new Unit(x, y, card.char, card.hp, 'player', card.rangedStrength, card.rangedSpeed, card.godName));
            }
        });
        tempUnitList.push(new Unit(20, 2, 'W', 5, 'enemy', 1, 6, 'Beroan'));
        if (this.chosenGod) {
            const affinities = this.chosenGod.affinities;
            for (const unit of tempUnitList) {
                if (unit.team === 'player') {
                    if (unit.godName === this.chosenGod.name) {
                        unit.hp = Math.round(unit.hp * 1.5);
                    }
                    if (unit.godName === affinities.positive) {
                        unit.rangedStrength = Math.round(unit.rangedStrength * 1.5);
                    }
                    if (unit.godName === affinities.negative) {
                        unit.hp = Math.round(unit.hp * 0.75);
                    }
                }
            }
        }
        this.units = tempUnitList;
        this.castingArray = Array(6).fill(null);
        this.playerHand = [];
        this.selectedHandIndex = null;
        this.gameState = 'TRIAL';
    }
}