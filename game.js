// 2D Miner Game
console.log("2D Miner Game Initialized");

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.7;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game initialization
function init() {
    console.log("Game starting...");
    // Game code will go here
}

// Start the game when page loads
window.addEventListener('load', init);
