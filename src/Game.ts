// src/Game.ts

import { type CardTemplate as Card, DECK as CARDS } from './Card';
import { PANTHEON, type God } from './God';
import { RenderingEngine, type RenderPayload } from './RenderingEngine';
import { Unit } from './Unit';
import { type GamePhase } from './types';
import { CombatEngine } from './CombatEngine';

export class Game {
    private renderingEngine: RenderingEngine;
    private combatEngine: CombatEngine;
    
    private gameState: GamePhase = 'GOD_SELECTION';
    private chosenGod: God | null = null;
    private playerAether: number = 3;
    private units: Unit[] = [];
    
    private prayerDeck: Card[] = [];
    private shoeSize: number = 3; // Defines how many sets of cards form the deck
    private playerHand: Card[] = [];
    private cardsInPrayer: Card[] = [];
    private castingArray: (Card | null)[] = [null, null, null, null, null, null];
    
    private selectedPrayerIndices: number[] = [];
    private selectedHandIndex: number | null = null;

    constructor(app: HTMLDivElement) {
        this.renderingEngine = new RenderingEngine(app);
        this.combatEngine = new CombatEngine();
        this.setupInputHandlers(app);
        this.render();
    }

    private setupInputHandlers(app: HTMLDivElement): void {
        app.addEventListener('click', (event) => {
            const target = (event.target as SVGElement).closest<HTMLElement>('[data-action]');
            if (target?.dataset.action) {
                this.handleAction(target.dataset.action, target.dataset);
            }
        });
    }

    private handleAction(action: string, dataset: DOMStringMap): void {
        switch (action) {
            case 'select-god':
                if (dataset.name) {
                    this.chosenGod = PANTHEON.find(g => g.name === dataset.name) || null;
                    if (this.chosenGod) this.startGame();
                }
                break;
            case 'select-card':
                if (dataset.index) this.togglePrayerCardSelection(parseInt(dataset.index, 10));
                break;
            case 'confirm-prayer':
                this.confirmPrayer();
                break;
            case 'select-hand-card':
                if (dataset.index) this.selectedHandIndex = parseInt(dataset.index, 10);
                break;
            case 'select-board-slot':
                if (dataset.index) this.placeCardInSlot(parseInt(dataset.index, 10));
                break;
            case 'sacrifice-card':
                this.sacrificeCard();
                break;
            case 'start-trial':
                this.startTrial();
                break;
            case 'continue':
                this.resetForNewRound();
                break;
        }
        this.render();
    }

    private startGame(): void {
        if (!this.chosenGod) return;
        
        // Build the deck from the shoe
        const newDeck: Card[] = [];
        for (let i = 0; i < this.shoeSize; i++) {
            newDeck.push(...CARDS); // Add a full copy of the master card list
        }
        this.prayerDeck = newDeck;

        this.shufflePrayerDeck();
        this.drawPrayerCards();
        this.gameState = 'PRAYER';
    }
    
    private getPrayerCost(): number {
        const numSelected = this.selectedPrayerIndices.length;
        // The total cost is the square of the number of cards selected.
        return numSelected * numSelected;
    }
    
    private togglePrayerCardSelection(index: number): void {
        const selectionIndex = this.selectedPrayerIndices.indexOf(index);
        if (selectionIndex > -1) {
            this.selectedPrayerIndices.splice(selectionIndex, 1);
        } else {
            this.selectedPrayerIndices.push(index);
        }
    }
    
    private confirmPrayer(): void {
        const cost = this.getPrayerCost();
        if (this.playerAether >= cost) {
            this.playerAether -= cost;
            const prayedCards = this.selectedPrayerIndices.map(i => this.cardsInPrayer[i]);
            this.playerHand.push(...prayedCards);
            this.selectedPrayerIndices = [];
            this.gameState = 'CASTING';
        } else {
            console.log("Not enough aether for this prayer.");
        }
    }

    private placeCardInSlot(slotIndex: number): void {
        if (this.selectedHandIndex === null || this.castingArray[slotIndex] !== null) {
            return;
        }
        const cardToPlace = this.playerHand[this.selectedHandIndex];
        this.castingArray[slotIndex] = cardToPlace;
        this.playerHand.splice(this.selectedHandIndex, 1);
        this.selectedHandIndex = null;
    }

    private sacrificeCard(): void {
        if (this.selectedHandIndex !== null) {
            this.playerHand.splice(this.selectedHandIndex, 1);
            this.playerAether++;
            this.selectedHandIndex = null;
        }
    }

    private startTrial(): void {
        this.units = [];

        // 1. Add the chosen God's Avatar (Champion)
        if (this.chosenGod) {
            const avatar = this.chosenGod.avatar;
            const avatarUnit = new Unit(
                20, 22, avatar.char, avatar.hp, 'player',
                avatar.rangedStrength, avatar.rangedSpeed, avatar.godName
            );
            this.units.push(avatarUnit);
        }

        // 2. Add units from the casting array
        this.castingArray.forEach((card, index) => {
            if (card && card.godName) {
                const isTopRow = index < 3;
                const x = 10 + (index % 3) * 10;
                const y = isTopRow ? 18 : 22;
                const newUnit = new Unit(
                    x, y, card.char, card.hp, 'player', 
                    card.rangedStrength, card.rangedSpeed, card.godName
                );
                this.units.push(newUnit);
            }
        });

        // 3. Add enemy units
        this.units.push(new Unit(15, 4, 'G', 10, 'enemy', 1, 1, 'Enemy God'));
        this.units.push(new Unit(25, 4, 'O', 20, 'enemy', 2, 1, 'Enemy God'));

        this.gameState = 'TRIAL';
        this.render();

        const trialInterval = setInterval(() => {
            this.units = this.combatEngine.updateTrial(this.units);
            this.render(); 

            const playerUnits = this.units.filter(u => u.team === 'player');
            const enemyUnits = this.units.filter(u => u.team === 'enemy');

            if (playerUnits.length === 0 || enemyUnits.length === 0) {
                clearInterval(trialInterval);
                this.gameState = 'JUDGEMENT';
                this.render();
            }
        }, 500);
    }

    private resetForNewRound(): void {
        this.playerAether = 3;
        this.playerHand = [];
        this.castingArray.fill(null);
        this.drawPrayerCards();
        this.gameState = 'PRAYER';
    }

    private shufflePrayerDeck(): void {
        for (let i = this.prayerDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.prayerDeck[i], this.prayerDeck[j]] = [this.prayerDeck[j], this.prayerDeck[i]];
        }
    }

    private drawPrayerCards(): void {
        this.cardsInPrayer = this.prayerDeck.slice(0, 7);
    }

    private render(): void {
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
            getPrayerCost: () => this.getPrayerCost(),
        };
        this.renderingEngine.render(payload);
    }
}