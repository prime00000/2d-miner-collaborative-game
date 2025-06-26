import { Game } from './core/Game.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    // Create and start the game
    const game = new Game(canvas);
    game.start();
    
    // Make game instance available globally for debugging
    window.game = game;
});