import { GameState } from './GameState.js';
import { Player } from '../entities/Player.js';
import { World } from '../entities/World.js';
import { Renderer } from '../systems/Renderer.js';
import { InputManager } from '../systems/InputManager.js';
import { Camera } from '../systems/Camera.js';
import { AchievementManager } from '../systems/AchievementManager.js';
import { LicenseManager } from '../systems/LicenseManager.js';
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
        this.world.setGameState(this.gameState); // Set reference for gravity checks
        this.player = new Player(this.gameState, this.world);
        this.renderer = new Renderer(canvas);
        this.inputManager = new InputManager(this.gameState);
        this.camera = new Camera(canvas, this.gameState);
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
        this.gameState.audioManager = this.audioManager; // Make it accessible to other components
        
        // Initialize achievement manager
        this.achievementManager = new AchievementManager(this.gameState);
        this.gameState.achievementManager = this.achievementManager;
        
        // Initialize license manager
        this.licenseManager = new LicenseManager(this.gameState);
        this.gameState.licenseManager = this.licenseManager;
        
        // Create UI components
        this.gameState.assayerMenu = new AssayerMenu(this.gameState);
        this.gameState.storeMenu = new StoreMenu(this.gameState);
        this.gameState.emergencyEnergyMenu = new EmergencyEnergyMenu(this.gameState);
        this.gameState.playerRef = this.player; // Store player reference for UI components
        this.gameState.renderer = this.renderer; // Store renderer reference for effects
        
        this.lastTime = 0;
        this.isRunning = false;
        
        // Damage indicator
        this.damageIndicator = {
            amount: 0,
            time: 0,
            maxTime: 2000 // 2 seconds
        };
        
        // Store game reference for damage tracking
        this.gameState.game = this;
        
        // Track last health value
        this.lastHealth = this.gameState.resources.health;
        
        // Try to load saved game
        // this.gameState.load(); // DISABLED for testing
        
        // Override energy and cash for testing
        this.gameState.resources.energy = 1000;
        this.gameState.resources.maxEnergy = 1000;
        this.gameState.resources.cash = 500; // Override cash for testing
        
        // Set initial max depth based on license
        this.gameState.elevator.maxDepth = this.licenseManager.getMaxDepth();
        
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
        
        // Update enemies
        this.world.updateEnemies(deltaTime);
        
        // Update camera
        this.camera.update();
        
        // Check for health changes
        if (this.gameState.resources.health < this.lastHealth) {
            const damage = this.lastHealth - this.gameState.resources.health;
            this.showDamageIndicator(damage);
            this.lastHealth = this.gameState.resources.health;
        } else if (this.gameState.resources.health > this.lastHealth) {
            // Health increased (healing)
            this.lastHealth = this.gameState.resources.health;
        }
        
        // Update damage indicator
        if (this.damageIndicator.time > 0) {
            this.damageIndicator.time -= deltaTime * 1000;
        }
        
        // Update achievements
        this.achievementManager.checkAchievements();
        this.achievementManager.update(deltaTime);
        
        // Track deep dives for licenses
        this.trackDeepDives();
        
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
    
    showDamageIndicator(damage) {
        this.damageIndicator.amount = damage;
        this.damageIndicator.time = this.damageIndicator.maxTime;
    }
    
    updateHUD() {
        const { player, resources, inventory, consumables, buffs } = this.gameState;
        document.getElementById('depthValue').textContent = `${Math.floor(player.depth)}m`;
        document.getElementById('cashValue').textContent = `$${resources.cash}`;
        
        // Update health bar
        const healthBar = document.getElementById('healthBar');
        const healthText = document.getElementById('healthText');
        const healthPercent = (resources.health / resources.maxHealth) * 100;
        
        if (healthBar) {
            healthBar.style.width = `${healthPercent}%`;
        }
        
        if (healthText) {
            let healthDisplay = `${resources.health}/${resources.maxHealth}`;
            if (this.damageIndicator.time > 0) {
                const opacity = this.damageIndicator.time / this.damageIndicator.maxTime;
                healthDisplay += ` <span style="color: #FF0000; opacity: ${opacity}; font-weight: bold;">-${this.damageIndicator.amount}</span>`;
            }
            healthText.innerHTML = healthDisplay;
        }
        
        // Update energy bar
        const energyBar = document.getElementById('energyBar');
        const energyText = document.getElementById('energyText');
        const energyPercent = (resources.energy / resources.maxEnergy) * 100;
        
        if (energyBar) {
            energyBar.style.width = `${energyPercent}%`;
        }
        
        if (energyText) {
            energyText.textContent = `${resources.energy}/${resources.maxEnergy}`;
        }
        
        // Update inventory display
        const inventoryItems = [];
        if (inventory.iron > 0) inventoryItems.push(`Iron:${inventory.iron}`);
        if (inventory.copper > 0) inventoryItems.push(`Copper:${inventory.copper}`);
        if (inventory.silver > 0) inventoryItems.push(`Silver:${inventory.silver}`);
        if (inventory.gold > 0) inventoryItems.push(`Gold:${inventory.gold}`);
        
        document.getElementById('inventoryValue').textContent = 
            inventoryItems.length > 0 ? inventoryItems.join(' ') : 'Empty';
        
        // Update consumables display
        const consumableItems = [];
        if (consumables && consumables.energyDrinks > 0) consumableItems.push(`[1]Drinks:${consumables.energyDrinks}`);
        if (consumables && consumables.luckyCharms > 0) consumableItems.push(`[2]Charms:${consumables.luckyCharms}`);
        if (consumables && consumables.explosiveCharges > 0) consumableItems.push(`[3]Bombs:${consumables.explosiveCharges}`);
        
        // Show active buffs
        if (buffs && buffs.luckyCharm && buffs.luckyCharm.active) {
            consumableItems.push(`🍀x1.5(${buffs.luckyCharm.tilesRemaining})`);
        }
        
        // Update or create consumables element
        let consumablesElement = document.getElementById('consumablesValue');
        if (!consumablesElement) {
            // Create consumables display if it doesn't exist
            const inventoryDiv = document.getElementById('inventoryValue').parentElement;
            if (inventoryDiv) {
                const consumablesDiv = inventoryDiv.cloneNode(true);
                const labelElement = consumablesDiv.querySelector('.hudLabel');
                const valueElement = consumablesDiv.querySelector('.hudValue');
                
                if (labelElement && valueElement) {
                    labelElement.textContent = 'Items:';
                    valueElement.id = 'consumablesValue';
                    inventoryDiv.parentElement.insertBefore(consumablesDiv, inventoryDiv.nextSibling);
                    consumablesElement = document.getElementById('consumablesValue');
                }
            }
        }
        
        if (consumablesElement) {
            consumablesElement.textContent = 
                consumableItems.length > 0 ? consumableItems.join(' ') : 'None';
        }
        
        // Update achievements display
        let achievementsElement = document.getElementById('achievementsValue');
        if (!achievementsElement) {
            // Create achievements display if it doesn't exist
            const hudContainer = document.getElementById('hudContainer');
            if (hudContainer) {
                const achievementsDiv = document.createElement('div');
                achievementsDiv.style.cssText = 'display: inline-block; margin-left: 20px;';
                achievementsDiv.innerHTML = `
                    <span class="hudLabel">Achievements:</span>
                    <span id="achievementsValue" class="hudValue"></span>
                `;
                hudContainer.appendChild(achievementsDiv);
                achievementsElement = document.getElementById('achievementsValue');
            }
        }
        
        if (achievementsElement && this.achievementManager) {
            const progress = this.achievementManager.getProgress();
            achievementsElement.textContent = `${progress.unlocked}/${progress.total} (${progress.percentage}%)`;
        }
        
        // Update license display
        let licenseElement = document.getElementById('licenseValue');
        if (!licenseElement) {
            // Create license display if it doesn't exist
            const depthDiv = document.getElementById('depthValue').parentElement;
            if (depthDiv) {
                const licenseDiv = depthDiv.cloneNode(true);
                const labelElement = licenseDiv.querySelector('.hudLabel');
                const valueElement = licenseDiv.querySelector('.hudValue');
                
                if (labelElement && valueElement) {
                    labelElement.textContent = 'License:';
                    valueElement.id = 'licenseValue';
                    depthDiv.parentElement.insertBefore(licenseDiv, depthDiv.nextSibling);
                    licenseElement = document.getElementById('licenseValue');
                }
            }
        }
        
        if (licenseElement && this.licenseManager) {
            const license = this.licenseManager.getCurrentLicense();
            const maxDepth = license.maxDepth === Infinity ? '∞' : `${license.maxDepth}m`;
            licenseElement.textContent = `${license.name} (Max: ${maxDepth})`;
        }
    }
    
    trackDeepDives() {
        const { player, stats, resources } = this.gameState;
        
        // Track 45m depth dives
        if (player.depth >= 45) {
            if (!stats.deepDiveStarted) {
                stats.deepDiveStarted = true;
                stats.currentDeepDive = player.depth;
            } else {
                stats.currentDeepDive = Math.max(stats.currentDeepDive, player.depth);
            }
        } else if (stats.deepDiveStarted && player.depth < 5) {
            // Player returned to surface after deep dive
            if (stats.currentDeepDive >= 45) {
                stats.deepDives45m++;
            }
            stats.deepDiveStarted = false;
            stats.currentDeepDive = 0;
        }
        
        // Track 90m survival
        if (player.depth >= 90 && resources.health > 0) {
            stats.survivedTo90m = true;
        }
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