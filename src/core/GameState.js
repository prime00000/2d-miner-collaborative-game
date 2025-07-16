import { SURFACE_Y, PLAYER_SIZE, MAX_DEPTH, INITIAL_RESOURCES, TILE_SIZE } from './Constants.js';
import { getInitialAchievements } from './Achievements.js';

export class GameState {
    constructor() {
        // Start player centered above elevator shaft
        const elevatorCenterX = 224; // Elevator center (from Constants.js)
        this.player = {
            x: elevatorCenterX, // Centered above elevator
            y: SURFACE_Y,
            vx: 0,
            vy: 0,
            isUnderground: false,
            depth: 0,
            height: PLAYER_SIZE // Add height for bat attachment
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
            improvedPickaxe: false,
            ironPickaxe: false,
            diamondPickaxe: false,
            ultimateWeapon: false,
            reinforcedBoots: false,
            energyPack: false,
            pocketRefinery: false,
            deepScanner: false
        };
        
        // Consumables inventory
        this.consumables = {
            energyDrinks: 0,
            luckyCharms: 0,
            explosiveCharges: 0
        };
        
        // Active buffs
        this.buffs = {
            luckyCharm: {
                active: false,
                tilesRemaining: 0
            }
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
        
        // Achievements
        this.achievements = getInitialAchievements();
        
        // Achievement tracking stats
        this.stats = {
            totalOresCollected: 0,
            totalTilesMined: 0,
            totalMoneyEarned: 0,
            consecutiveOres: 0,
            sessionStartTime: Date.now(),
            lastDeathTime: 0,
            hasEverDied: false,
            // License requirement tracking
            copperCollected: 0,
            silverCollected: 0,
            goldCollected: 0,
            deepDives45m: 0,
            survivedTo90m: false,
            currentDeepDive: 0, // Track current dive depth
            deepDiveStarted: false,
            // Line clearing tracking
            linesCleared: 0,
            tilesUntilRegeneration: 0
        };
        
        // Current license
        this.currentLicense = 'surface';
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
        // Start at row 7 (skip the border row 6), which is 2 tiles below surface
        this.player.y = SURFACE_Y + (2 * TILE_SIZE); // Row 7: Y = 256
        this.elevator.isActive = true;
        // Ensure player is grid-aligned when entering underground
        this.player.x = Math.round(this.player.x / TILE_SIZE) * TILE_SIZE;
    }
    
    // Return to surface
    returnToSurface() {
        this.player.isUnderground = false;
        this.player.depth = 0;
        this.player.y = SURFACE_Y;
        this.elevator.isActive = false;
    }
    
    // Save game state
    save() {
        const saveData = {
            player: { ...this.player },
            resources: { ...this.resources },
            inventory: { ...this.inventory },
            upgrades: { ...this.upgrades },
            consumables: { ...this.consumables },
            buffs: { ...this.buffs },
            elevator: { ...this.elevator },
            achievements: { ...this.achievements },
            stats: { ...this.stats },
            currentLicense: this.currentLicense,
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
                this.consumables = { ...this.consumables, ...(data.consumables || {}) };
                this.buffs = { ...this.buffs, ...(data.buffs || {}) };
                this.elevator = { ...this.elevator, ...data.elevator };
                
                // Load achievements and stats
                if (data.achievements) {
                    this.achievements = { ...this.achievements, ...data.achievements };
                }
                if (data.stats) {
                    this.stats = { ...this.stats, ...data.stats };
                    // Update session start time to now
                    this.stats.sessionStartTime = Date.now();
                }
                
                // Load license
                if (data.currentLicense) {
                    this.currentLicense = data.currentLicense;
                }
                
                // Apply energy pack upgrade if present
                if (this.upgrades.energyPack) {
                    this.resources.maxEnergy = 1500;
                }
                
                return true;
            } catch (e) {
                console.error('Failed to load save data:', e);
            }
        }
        return false;
    }
}