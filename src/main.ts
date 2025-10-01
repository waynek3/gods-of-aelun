// src/main.ts

import './style.css'
import { Game } from './Game';

const app = document.querySelector<HTMLDivElement>('#app')!
const game = new Game(app);
game.start();