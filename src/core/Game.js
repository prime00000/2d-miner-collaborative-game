import { GameState } from './GameState.js';
import { Player } from '../entities/Player.js';
import { World } from '../entities/World.js';
import { Renderer } from '../systems/Renderer.js';
import { InputManager } from '../systems/InputManager.js';
import { Camera } from '../systems/Camera.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.gameState = new GameState();
        this.world = new World();
        this.player = new Player(this.gameState, this.world);
        this.renderer = new Renderer(canvas);
        this.inputManager = new InputManager(this.gameState);
        this.camera = new Camera(canvas, this.gameState);
        
        this.lastTime = 0;
        this.isRunning = false;
        
        // Try to load saved game
        this.gameState.load();
        
        // Override fuel for testing
        this.gameState.resources.fuel = 1000;
        this.gameState.resources.maxFuel = 1000;
        this.player.fuel = 1000;
        this.player.maxFuel = 1000;
        
        // Setup resize handler
        this.setupResizeHandler();
    }
    
    setupResizeHandler() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const hud = document.getElementById('hudContainer');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight - hud.clientHeight;
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    stop() {
        this.isRunning = false;
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update player
        this.player.update(deltaTime, this.inputManager.getInput());
        
        // Update camera
        this.camera.update();
        
        // Update HUD
        this.updateHUD();
        
        // Update debug info
        this.updateDebug();
        
        // Auto-save every 30 seconds
        if (Math.floor(performance.now() / 30000) !== Math.floor(this.lastTime / 30000)) {
            this.gameState.save();
        }
    }
    
    render() {
        this.renderer.render(this.gameState, this.world, this.player);
    }
    
    updateHUD() {
        const { player, resources } = this.gameState;
        document.getElementById('depthValue').textContent = `${Math.floor(player.depth)}m`;
        document.getElementById('cashValue').textContent = `$${resources.cash}`;
        document.getElementById('healthValue').textContent = `${resources.health}/${resources.maxHealth}`;
        document.getElementById('fuelValue').textContent = `${resources.fuel}/${resources.maxFuel}`;
    }
    
    updateDebug() {
        const debugDiv = document.getElementById('debugInfo');
        if (debugDiv && debugDiv.style.display !== 'none') {
            const { player, camera, elevator } = this.gameState;
            debugDiv.innerHTML = `
                Player: (${Math.floor(player.x)}, ${Math.floor(player.y)})<br>
                Depth: ${player.depth.toFixed(1)}m<br>
                Underground: ${player.isUnderground}<br>
                Camera: (${Math.floor(camera.x)}, ${Math.floor(camera.y)})<br>
                At Elevator: ${this.player.isAtElevator()}<br>
                Elevator Active: ${elevator.isActive}
            `;
        }
    }
}