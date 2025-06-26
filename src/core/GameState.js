import { SURFACE_Y, PLAYER_SIZE, MAX_DEPTH, INITIAL_RESOURCES, TILE_SIZE } from './Constants.js';

export class GameState {
    constructor() {
        this.player = {
            x: Math.round(250 / TILE_SIZE) * TILE_SIZE, // Grid-aligned X position
            y: SURFACE_Y - PLAYER_SIZE,
            vx: 0,
            vy: 0,
            isUnderground: false,
            depth: 0
        };
        
        this.camera = {
            x: 0,
            y: 0
        };
        
        this.resources = { ...INITIAL_RESOURCES };
        
        // Inventory for ores
        this.inventory = {
            iron: 0,
            copper: 0,
            silver: 0,
            gold: 0
        };
        
        // Upgrades
        this.upgrades = {
            improvedPickaxe: false
        };
        
        this.elevator = {
            isActive: false,
            currentDepth: 0,
            maxDepth: MAX_DEPTH
        };
        
        this.input = {
            keys: {},
            touches: {}
        };
    }
    
    // Update resource values
    updateResource(resource, value) {
        if (this.resources.hasOwnProperty(resource)) {
            this.resources[resource] = value;
        }
    }
    
    // Get current resource value
    getResource(resource) {
        return this.resources[resource] || 0;
    }
    
    // Check if player is at a specific location
    isPlayerAt(x, tolerance = 30) {
        return Math.abs(this.player.x - x) < tolerance;
    }
    
    // Enter underground
    enterUnderground() {
        this.player.isUnderground = true;
        this.player.depth = 1;
        this.player.y = SURFACE_Y + TILE_SIZE;
        this.elevator.isActive = true;
        // Ensure player is grid-aligned when entering underground
        this.player.x = Math.round(this.player.x / TILE_SIZE) * TILE_SIZE;
    }
    
    // Return to surface
    returnToSurface() {
        this.player.isUnderground = false;
        this.player.depth = 0;
        this.player.y = SURFACE_Y - PLAYER_SIZE;
        this.elevator.isActive = false;
    }
    
    // Save game state
    save() {
        const saveData = {
            player: { ...this.player },
            resources: { ...this.resources },
            inventory: { ...this.inventory },
            upgrades: { ...this.upgrades },
            elevator: { ...this.elevator },
            timestamp: Date.now()
        };
        localStorage.setItem('miningGameSave', JSON.stringify(saveData));
    }
    
    // Load game state
    load() {
        const savedData = localStorage.getItem('miningGameSave');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.player = { ...this.player, ...data.player };
                this.resources = { ...this.resources, ...data.resources };
                this.inventory = { ...this.inventory, ...data.inventory };
                this.upgrades = { ...this.upgrades, ...data.upgrades };
                this.elevator = { ...this.elevator, ...data.elevator };
                return true;
            } catch (e) {
                console.error('Failed to load save data:', e);
            }
        }
        return false;
    }
}