import { INITIAL_STATS, DEPTH_WARRANTS, UPGRADES } from './Constants.js';

export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        // Player state
        this.player = {
            health: INITIAL_STATS.health,
            maxHealth: INITIAL_STATS.maxHealth,
            fuel: INITIAL_STATS.fuel,
            maxFuel: INITIAL_STATS.maxFuel,
            cash: INITIAL_STATS.cash,
            position: { x: 10, y: 0 }, // Grid coordinates
            velocity: { x: 0, y: 0 },
            facing: 'right',
            isGrounded: true,
            isMining: false,
            miningProgress: 0,
            miningTarget: null
        };

        // Inventory
        this.inventory = {
            capacity: INITIAL_STATS.inventoryCapacity,
            items: new Map(), // Map of valuable type to count
            totalWeight: 0
        };

        // Game state
        this.game = {
            underground: false,
            currentDepth: 0,
            selectedDepth: 0,
            paused: false,
            gameOver: false,
            timeElapsed: 0,
            lastUpdateTime: Date.now()
        };

        // Upgrades (level starts at 0)
        this.upgrades = {
            fuelTank: 0,
            carryingCapacity: 0,
            protectiveGear: 0,
            miningSpeed: 0
        };

        // Unlocked depths
        this.unlockedDepths = new Set(['surface']);

        // Statistics
        this.statistics = {
            totalEarnings: 0,
            totalBlocksMined: 0,
            totalValuablesCollected: new Map(),
            deepestDepth: 0,
            timePlayed: 0,
            deaths: 0
        };
    }

    // Player methods
    updatePlayerPosition(x, y) {
        this.player.position.x = x;
        this.player.position.y = y;
    }

    updatePlayerVelocity(vx, vy) {
        this.player.velocity.x = vx;
        this.player.velocity.y = vy;
    }

    takeDamage(amount) {
        const reduction = 1 - (this.upgrades.protectiveGear * UPGRADES.protectiveGear.damageReduction);
        const actualDamage = Math.floor(amount * reduction);
        this.player.health = Math.max(0, this.player.health - actualDamage);
        
        if (this.player.health <= 0) {
            this.gameOver();
        }
        
        return actualDamage;
    }

    healPlayer(amount) {
        this.player.health = Math.min(this.player.maxHealth, this.player.health + amount);
    }

    consumeFuel(amount) {
        this.player.fuel = Math.max(0, this.player.fuel - amount);
        return this.player.fuel > 0;
    }

    refuelPlayer(amount = null) {
        if (amount === null) {
            this.player.fuel = this.player.maxFuel;
        } else {
            this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + amount);
        }
    }

    // Inventory methods
    addToInventory(valuableType, count = 1) {
        const currentCount = this.inventory.items.get(valuableType) || 0;
        const newTotal = this.inventory.totalWeight + count;
        
        if (newTotal <= this.inventory.capacity) {
            this.inventory.items.set(valuableType, currentCount + count);
            this.inventory.totalWeight = newTotal;
            
            // Update statistics
            const statsCount = this.statistics.totalValuablesCollected.get(valuableType) || 0;
            this.statistics.totalValuablesCollected.set(valuableType, statsCount + count);
            
            return true;
        }
        return false;
    }

    removeFromInventory(valuableType, count = 1) {
        const currentCount = this.inventory.items.get(valuableType) || 0;
        if (currentCount >= count) {
            const newCount = currentCount - count;
            if (newCount === 0) {
                this.inventory.items.delete(valuableType);
            } else {
                this.inventory.items.set(valuableType, newCount);
            }
            this.inventory.totalWeight = Math.max(0, this.inventory.totalWeight - count);
            return true;
        }
        return false;
    }

    clearInventory() {
        this.inventory.items.clear();
        this.inventory.totalWeight = 0;
    }

    getInventoryValue() {
        let totalValue = 0;
        for (const [type, count] of this.inventory.items) {
            const valuable = VALUABLES[type];
            if (valuable) {
                totalValue += valuable.value * count;
            }
        }
        return totalValue;
    }

    sellInventory() {
        const value = this.getInventoryValue();
        this.player.cash += value;
        this.statistics.totalEarnings += value;
        this.clearInventory();
        return value;
    }

    // Upgrade methods
    canAffordUpgrade(upgradeType) {
        const upgrade = UPGRADES[upgradeType];
        if (!upgrade) return false;
        
        const currentLevel = this.upgrades[upgradeType];
        if (currentLevel >= upgrade.maxLevel) return false;
        
        const cost = this.getUpgradeCost(upgradeType);
        return this.player.cash >= cost;
    }

    getUpgradeCost(upgradeType) {
        const upgrade = UPGRADES[upgradeType];
        if (!upgrade) return Infinity;
        
        const currentLevel = this.upgrades[upgradeType];
        if (currentLevel >= upgrade.maxLevel) return Infinity;
        
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    }

    purchaseUpgrade(upgradeType) {
        if (!this.canAffordUpgrade(upgradeType)) return false;
        
        const cost = this.getUpgradeCost(upgradeType);
        this.player.cash -= cost;
        this.upgrades[upgradeType]++;
        
        // Apply upgrade effects
        this.applyUpgrades();
        
        return true;
    }

    applyUpgrades() {
        // Update fuel tank capacity
        const fuelUpgrade = UPGRADES.fuelTank;
        this.player.maxFuel = fuelUpgrade.baseValue + (this.upgrades.fuelTank * fuelUpgrade.increment);
        
        // Update carrying capacity
        const carryUpgrade = UPGRADES.carryingCapacity;
        this.inventory.capacity = carryUpgrade.baseValue + (this.upgrades.carryingCapacity * carryUpgrade.increment);
    }

    // Depth warrant methods
    canAffordDepthWarrant(depthKey) {
        const warrant = DEPTH_WARRANTS[depthKey];
        if (!warrant || this.unlockedDepths.has(depthKey)) return false;
        return this.player.cash >= warrant.cost;
    }

    purchaseDepthWarrant(depthKey) {
        if (!this.canAffordDepthWarrant(depthKey)) return false;
        
        const warrant = DEPTH_WARRANTS[depthKey];
        this.player.cash -= warrant.cost;
        this.unlockedDepths.add(depthKey);
        
        // Update deepest depth statistic
        if (warrant.depth > this.statistics.deepestDepth) {
            this.statistics.deepestDepth = warrant.depth;
        }
        
        return true;
    }

    isDepthUnlocked(depthKey) {
        return this.unlockedDepths.has(depthKey);
    }

    // Game state methods
    goUnderground(depth) {
        if (!this.isDepthUnlocked(this.getDepthKeyByValue(depth))) return false;
        
        this.game.underground = true;
        this.game.currentDepth = depth;
        this.game.selectedDepth = depth;
        return true;
    }

    returnToSurface() {
        this.game.underground = false;
        this.game.currentDepth = 0;
        this.player.position = { x: 10, y: 0 };
        this.player.velocity = { x: 0, y: 0 };
    }

    pauseGame() {
        this.game.paused = true;
    }

    resumeGame() {
        this.game.paused = false;
        this.game.lastUpdateTime = Date.now();
    }

    gameOver() {
        this.game.gameOver = true;
        this.statistics.deaths++;
    }

    // Utility methods
    getDepthKeyByValue(depth) {
        for (const [key, warrant] of Object.entries(DEPTH_WARRANTS)) {
            if (warrant.depth === depth) return key;
        }
        return null;
    }

    getMiningSpeedMultiplier() {
        return 1 + (this.upgrades.miningSpeed * UPGRADES.miningSpeed.speedIncrease);
    }

    getDamageReduction() {
        return this.upgrades.protectiveGear * UPGRADES.protectiveGear.damageReduction;
    }

    // Save/Load methods
    toJSON() {
        return {
            player: this.player,
            inventory: {
                capacity: this.inventory.capacity,
                items: Array.from(this.inventory.items.entries()),
                totalWeight: this.inventory.totalWeight
            },
            game: this.game,
            upgrades: this.upgrades,
            unlockedDepths: Array.from(this.unlockedDepths),
            statistics: {
                ...this.statistics,
                totalValuablesCollected: Array.from(this.statistics.totalValuablesCollected.entries())
            }
        };
    }

    fromJSON(data) {
        this.player = data.player;
        this.inventory = {
            capacity: data.inventory.capacity,
            items: new Map(data.inventory.items),
            totalWeight: data.inventory.totalWeight
        };
        this.game = data.game;
        this.upgrades = data.upgrades;
        this.unlockedDepths = new Set(data.unlockedDepths);
        this.statistics = {
            ...data.statistics,
            totalValuablesCollected: new Map(data.statistics.totalValuablesCollected)
        };
        
        // Reapply upgrades to ensure consistency
        this.applyUpgrades();
    }

    // Update method
    update(deltaTime) {
        if (this.game.paused || this.game.gameOver) return;
        
        this.game.timeElapsed += deltaTime;
        this.statistics.timePlayed += deltaTime;
        
        // Update mining progress
        if (this.player.isMining && this.player.miningTarget) {
            const miningSpeed = this.getMiningSpeedMultiplier();
            this.player.miningProgress += (deltaTime / 1000) * miningSpeed;
        }
    }
}

// Import reference fix
import { VALUABLES } from './Constants.js';