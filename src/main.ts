// src/main.ts

import './style.css'
import { Game } from './Game';

const app = document.querySelector<HTMLDivElement>('#app')!;

function resizeAndStartGame() {
  const gameContainer = app.querySelector('.game-container') as HTMLElement;
  if (!gameContainer) return; // Wait until the container is rendered

  // 1. Get the available screen space
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // 2. Calculate the size of a single character/cell based on screen dimensions
  const charWidth = Math.floor(screenWidth / 42); // 42 is our grid width
  const charHeight = Math.floor(screenHeight / 24); // 24 is our grid height

  // 3. Use the smaller of the two to determine our master font size
  // This ensures the game fits both vertically and horizontally
  const baseFontSize = Math.min(charWidth, charHeight);

  // 4. Calculate the final pixel-perfect width and height for the container
  const perfectWidth = baseFontSize * 42;
  const perfectHeight = baseFontSize * 24;

  // 5. Apply the calculated dimensions and font size
  gameContainer.style.width = `${perfectWidth}px`;
  gameContainer.style.height = `${perfectHeight}px`;
  gameContainer.style.fontSize = `${baseFontSize}px`;
}

// Create the game instance
const game = new Game(app);

// Start the game loop
game.start();

// Run our resize function after the first render to make sure the element exists
setTimeout(() => {
  resizeAndStartGame();
  // Also run it if the window is ever resized (e.g., phone rotation)
  window.addEventListener('resize', resizeAndStartGame);
}, 0);