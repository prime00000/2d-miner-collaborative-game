import { GameState } from './GameState.js';
import { Player } from '../entities/Player.js';
import { World } from '../entities/World.js';
import { Renderer } from '../systems/Renderer.js';
import { InputManager } from '../systems/InputManager.js';
import { Camera } from '../systems/Camera.js';
import { AssayerMenu } from '../ui/AssayerMenu.js';
import { StoreMenu } from '../ui/StoreMenu.js';
import { EmergencyEnergyMenu } from '../ui/EmergencyEnergyMenu.js';
import { SURFACE_Y } from './Constants.js';
import AudioManager from '../systems/AudioManager.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.gameState = new GameState();
        this.world = new World();
        this.player = new Player(this.gameState, this.world);
        this.renderer = new Renderer(canvas);
        this.inputManager = new InputManager(this.gameState);
        this.camera = new Camera(canvas, this.gameState);
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
        this.gameState.audioManager = this.audioManager; // Make it accessible to other components
        
        // Create UI components
        this.gameState.assayerMenu = new AssayerMenu(this.gameState);
        this.gameState.storeMenu = new StoreMenu(this.gameState);
        this.gameState.emergencyEnergyMenu = new EmergencyEnergyMenu(this.gameState);
        this.gameState.playerRef = this.player; // Store player reference for UI components
        
        this.lastTime = 0;
        this.isRunning = false;
        
        // Try to load saved game
        // this.gameState.load(); // DISABLED for testing
        
        // Override energy and cash for testing
        this.gameState.resources.energy = 1000;
        this.gameState.resources.maxEnergy = 1000;
        this.gameState.resources.cash = 500; // Override cash for testing
        
        // Ensure player starts on surface if this is causing issues
        if (this.gameState.player.y > SURFACE_Y) {
            this.gameState.returnToSurface();
        }
        
        // Setup resize handler
        this.setupResizeHandler();
        
        // Setup audio initialization on first user interaction
        this.setupAudioInit();
    }
    
    setupAudioInit() {
        const initAudio = async () => {
            if (!this.audioManager.initialized) {
                await this.audioManager.init();
                console.log('Audio system initialized');
                // Start background music
                this.audioManager.playMusic('main_theme');
                // Remove the listener after initialization
                document.removeEventListener('click', initAudio);
                document.removeEventListener('keydown', initAudio);
            }
        };
        
        // Initialize audio on first user interaction
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
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
        
        // Check for emergency energy menu
        this.gameState.emergencyEnergyMenu.checkAndShow();
        
        // Auto-save every 30 seconds
        // if (Math.floor(performance.now() / 30000) !== Math.floor(this.lastTime / 30000)) {
        //     this.gameState.save();
        // } // DISABLED for testing
    }
    
    render() {
        this.renderer.render(this.gameState, this.world, this.player);
    }
    
    updateHUD() {
        const { player, resources, inventory } = this.gameState;
        document.getElementById('depthValue').textContent = `${Math.floor(player.depth)}m`;
        document.getElementById('cashValue').textContent = `$${resources.cash}`;
        document.getElementById('healthValue').textContent = `${resources.health}/${resources.maxHealth}`;
        document.getElementById('energyValue').textContent = `${resources.energy}/${resources.maxEnergy}`;
        
        // Update inventory display
        const inventoryItems = [];
        if (inventory.iron > 0) inventoryItems.push(`Iron:${inventory.iron}`);
        if (inventory.copper > 0) inventoryItems.push(`Copper:${inventory.copper}`);
        if (inventory.silver > 0) inventoryItems.push(`Silver:${inventory.silver}`);
        if (inventory.gold > 0) inventoryItems.push(`Gold:${inventory.gold}`);
        
        document.getElementById('inventoryValue').textContent = 
            inventoryItems.length > 0 ? inventoryItems.join(' ') : 'Empty';
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