// src/main.ts

import './style.css'
import { Game } from './Game';

// Select the main app container from the HTML
const app = document.querySelector<HTMLDivElement>('#app');

// If the container exists, create the game instance.
// The game will start automatically from its constructor.
if (app) {
  new Game(app);
}