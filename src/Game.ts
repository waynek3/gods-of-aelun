// src/Game.ts

import { Unit } from './Unit';
import { type CardTemplate, DECK } from './Card';
import { RenderingEngine, type RenderPayload } from './RenderingEngine';
import { CombatEngine } from './CombatEngine';
import type { GamePhase } from './types';
import { type God, PANTHEON } from './God';

const CHAR_PIXEL_WIDTH = 10;
const CHAR_PIXEL_HEIGHT = 18;

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
    
    private getPrayerCost = (): number => {
        const costs = [1, 3, 5, 8, 13, 21, 34];
        let totalCost = 0;
        for (let i = 0; i < this.selectedPrayerIndices.length; i++) {
            totalCost += costs[i] || 0;
        }
        return totalCost;
    };
    
    private handleInput(e: MouseEvent | TouchEvent) {
        e.preventDefault();
        const gameContainer = (e.currentTarget as HTMLElement).querySelector('.game-container');
        if (!gameContainer) return;

        const rect = gameContainer.getBoundingClientRect();
        
        let clientX, clientY;
        if (e instanceof MouseEvent) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        }

        const scale = rect.width / (CHAR_PIXEL_WIDTH * 42);
        const x = (clientX - rect.left) / scale;
        const y = (clientY - rect.top) / scale;

        const gridX = Math.floor(x / CHAR_PIXEL_WIDTH);
        const gridY = Math.floor(y / CHAR_PIXEL_HEIGHT);

        if (this.gameState === 'GOD_SELECTION') {
            PANTHEON.forEach((god, index) => {
                if (gridY === 8 + (index * 4)) {
                    this.chosenGod = god;
                    this.enterPrayerPhase();
                }
            });
        } else if (this.gameState === 'PRAYER') {
            const cardPositions = [{x: 5, y: 9}, {x: 18, y: 9}, {x: 31, y: 9}, {x: 5, y: 15}, {x: 18, y: 15}, {x: 31, y: 15}, {x: 18, y: 21}];
            
            cardPositions.forEach((pos, index) => {
                if (gridY >= pos.y - 1 && gridY <= pos.y + 1 && gridX >= pos.x && gridX <= pos.x + 5) {
                    if (this.selectedPrayerIndices.includes(index)) {
                        this.selectedPrayerIndices = this.selectedPrayerIndices.filter(i => i !== index);
                    } else {
                        this.selectedPrayerIndices.push(index);
                    }
                }
            });

            if (gridY >= 20 && gridY <= 21) {
                 this.confirmPrayerSelection();
            }
        } else if (this.gameState === 'CASTING') {
            this.playerHand.forEach((_card, index) => {
                const cardX = 3 + (index * 7);
                if (gridY === 20 && gridX >= cardX && gridX <= cardX + 2) {
                    this.selectedHandIndex = this.selectedHandIndex === index ? null : index;
                }
            });
            const boardPositions = [{x:5,y:8},{x:18,y:8},{x:31,y:8},{x:5,y:13},{x:18,y:13},{x:31,y:13}];
            boardPositions.forEach((pos, index) => {
                if (gridY >= pos.y-1 && gridY <= pos.y+1 && gridX >= pos.x && gridX <= pos.x+5) {
                    if (this.selectedHandIndex !== null && this.playerHand[this.selectedHandIndex] && this.castingArray[index] === null) {
                        const cardToPlace = this.playerHand.splice(this.selectedHandIndex, 1)[0];
                        this.castingArray[index] = cardToPlace;
                        this.selectedHandIndex = null;
                    }
                }
            });
            if (this.selectedHandIndex !== null && gridY === 18) {
                this.sacrificeSelectedCard();
            }
            if (gridY === 22) {
                this.startNewTrial();
            }
        } else if (this.gameState === 'JUDGEMENT') {
            if (gridY === 15) this.enterPrayerPhase();
        }

        this.render();
    }

    private sacrificeSelectedCard() {
        if (this.selectedHandIndex !== null && this.playerHand[this.selectedHandIndex]) {
            this.playerHand.splice(this.selectedHandIndex, 1);
            this.playerAether += 1;
            this.selectedHandIndex = null;
        }
    }

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
        const selectedCards = this.selectedPrayerIndices
            .sort((a,b) => a - b)
            .map(i => this.cardsInPrayer[i]);
        this.playerHand.push(...selectedCards);
        this.gameState = 'CASTING';
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