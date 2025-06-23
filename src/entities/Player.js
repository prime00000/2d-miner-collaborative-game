import { INITIAL_STATS, PHYSICS, TILE_TYPES, UPGRADES, VALUABLES } from '../core/Constants.js';

export class Player {
    constructor(gameState, world) {
        this.gameState = gameState;
        this.world = world;
        
        // Position and physics
        this.position = { x: 10, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.gridPosition = { x: 0, y: 0 };
        this.facing = 'right';
        this.isGrounded = false;
        this.isMoving = false;
        
        // Resources
        this.health = INITIAL_STATS.health;
        this.maxHealth = INITIAL_STATS.maxHealth;
        this.fuel = INITIAL_STATS.fuel;
        this.maxFuel = INITIAL_STATS.maxFuel;
        this.cash = INITIAL_STATS.cash;
        
        // Inventory
        this.inventory = new Map();
        this.inventoryCapacity = INITIAL_STATS.inventoryCapacity;
        
        // Mining state
        this.isMining = false;
        this.miningProgress = 0;
        this.miningTarget = null;
        this.miningTime = PHYSICS.miningTime;
        
        // Animation state
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        // Input state
        this.inputState = {
            left: false,
            right: false,
            up: false,
            down: false,
            mine: false
        };
    }

    // Update player state
    update(deltaTime) {
        // Update position based on velocity
        this.updatePosition(deltaTime);
        
        // Update mining
        if (this.isMining) {
            this.updateMining(deltaTime);
        }
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update grid position
        this.updateGridPosition();
        
        // Sync with game state
        this.syncWithGameState();
    }

    // Position and movement
    updatePosition(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Apply gravity if not grounded
        if (!this.isGrounded && this.world.currentDepth > 0) {
            this.velocity.y += PHYSICS.gravity * dt * 60;
            this.velocity.y = Math.min(this.velocity.y, PHYSICS.maxFallSpeed);
        }
        
        // Apply horizontal movement based on input
        if (this.inputState.left && !this.inputState.right) {
            this.velocity.x = -PHYSICS.playerSpeed;
            this.facing = 'left';
            this.isMoving = true;
        } else if (this.inputState.right && !this.inputState.left) {
            this.velocity.x = PHYSICS.playerSpeed;
            this.facing = 'right';
            this.isMoving = true;
        } else {
            this.velocity.x = 0;
            this.isMoving = false;
        }
        
        // Apply velocity with collision detection
        if (this.velocity.x !== 0) {
            this.moveHorizontal(this.velocity.x * dt);
        }
        if (this.velocity.y !== 0) {
            this.moveVertical(this.velocity.y * dt);
        }
        
        // Check ground collision
        this.checkGrounded();
    }

    moveHorizontal(dx) {
        const newX = this.position.x + dx;
        const gridX = Math.floor(newX / TILE_SIZE);
        const gridY = Math.floor(this.position.y / TILE_SIZE);
        
        // Check collision with tiles
        if (this.canMoveTo(gridX, gridY)) {
            this.position.x = newX;
        } else {
            // Stop at wall
            this.velocity.x = 0;
            if (dx > 0) {
                this.position.x = gridX * TILE_SIZE - 0.1;
            } else {
                this.position.x = (gridX + 1) * TILE_SIZE + 0.1;
            }
        }
    }

    moveVertical(dy) {
        const newY = this.position.y + dy;
        const gridX = Math.floor(this.position.x / TILE_SIZE);
        const gridY = Math.floor(newY / TILE_SIZE);
        
        // Check collision with tiles
        if (this.canMoveTo(gridX, gridY)) {
            this.position.y = newY;
        } else {
            // Stop at floor/ceiling
            this.velocity.y = 0;
            if (dy > 0) {
                this.position.y = gridY * TILE_SIZE - 0.1;
                this.isGrounded = true;
            } else {
                this.position.y = (gridY + 1) * TILE_SIZE + 0.1;
            }
        }
    }

    canMoveTo(gridX, gridY) {
        // Check if position is valid
        if (!this.world.isValidPosition(gridX, gridY)) {
            return false;
        }
        
        // Check if tile is solid
        return !this.world.isSolid(gridX, gridY);
    }

    checkGrounded() {
        const gridX = Math.floor(this.position.x / TILE_SIZE);
        const gridY = Math.floor(this.position.y / TILE_SIZE);
        const belowY = gridY + 1;
        
        this.isGrounded = this.world.isSolid(gridX, belowY);
    }

    updateGridPosition() {
        this.gridPosition.x = Math.floor(this.position.x / TILE_SIZE);
        this.gridPosition.y = Math.floor(this.position.y / TILE_SIZE);
    }

    // Mining
    startMining(direction) {
        if (this.isMining || this.fuel <= 0) return false;
        
        const targetX = this.gridPosition.x + direction.x;
        const targetY = this.gridPosition.y + direction.y;
        
        if (this.world.isMineable(targetX, targetY)) {
            this.isMining = true;
            this.miningProgress = 0;
            this.miningTarget = { x: targetX, y: targetY };
            
            // Calculate mining time based on tile type and upgrades
            const tile = this.world.getTile(targetX, targetY);
            const baseTime = tile.type === TILE_TYPES.STONE ? PHYSICS.miningTime * 1.5 : PHYSICS.miningTime;
            this.miningTime = baseTime / this.getMiningSpeedMultiplier();
            
            return true;
        }
        
        return false;
    }

    updateMining(deltaTime) {
        if (!this.isMining || !this.miningTarget) return;
        
        this.miningProgress += deltaTime;
        
        if (this.miningProgress >= this.miningTime) {
            this.completeMining();
        }
    }

    completeMining() {
        if (!this.miningTarget) return;
        
        // Consume fuel
        if (!this.consumeFuel(1)) {
            this.cancelMining();
            return;
        }
        
        // Mine the tile
        const result = this.world.mineTile(this.miningTarget.x, this.miningTarget.y);
        
        // Collect valuable if present
        if (result.valuable) {
            this.collectValuable(result.valuable);
        }
        
        // Trigger hazard if present
        if (result.hazard) {
            this.triggerHazard(result.hazard, this.miningTarget.x, this.miningTarget.y);
        }
        
        // Update statistics
        if (this.gameState) {
            this.gameState.statistics.totalBlocksMined++;
        }
        
        // Reset mining state
        this.cancelMining();
    }

    cancelMining() {
        this.isMining = false;
        this.miningProgress = 0;
        this.miningTarget = null;
    }

    getMiningSpeedMultiplier() {
        if (this.gameState) {
            return this.gameState.getMiningSpeedMultiplier();
        }
        return 1;
    }

    // Resource management
    takeDamage(amount) {
        const reduction = this.gameState ? this.gameState.getDamageReduction() : 0;
        const actualDamage = Math.floor(amount * (1 - reduction));
        
        this.health = Math.max(0, this.health - actualDamage);
        
        if (this.gameState) {
            this.gameState.player.health = this.health;
        }
        
        if (this.health <= 0) {
            this.die();
        }
        
        return actualDamage;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        if (this.gameState) {
            this.gameState.player.health = this.health;
        }
    }

    consumeFuel(amount) {
        if (this.fuel < amount) return false;
        
        this.fuel -= amount;
        if (this.gameState) {
            this.gameState.player.fuel = this.fuel;
        }
        
        return true;
    }

    refuel(amount = null) {
        if (amount === null) {
            this.fuel = this.maxFuel;
        } else {
            this.fuel = Math.min(this.maxFuel, this.fuel + amount);
        }
        
        if (this.gameState) {
            this.gameState.player.fuel = this.fuel;
        }
    }

    // Inventory management
    collectValuable(valuableType) {
        const currentCount = this.inventory.get(valuableType) || 0;
        const totalItems = this.getInventoryCount();
        
        if (totalItems < this.inventoryCapacity) {
            this.inventory.set(valuableType, currentCount + 1);
            
            // Update game state
            if (this.gameState) {
                this.gameState.addToInventory(valuableType, 1);
            }
            
            return true;
        }
        
        return false;
    }

    getInventoryCount() {
        let count = 0;
        for (const [type, amount] of this.inventory) {
            count += amount;
        }
        return count;
    }

    getInventoryValue() {
        let value = 0;
        for (const [type, amount] of this.inventory) {
            const valuable = VALUABLES[type];
            if (valuable) {
                value += valuable.value * amount;
            }
        }
        return value;
    }

    sellInventory() {
        const value = this.getInventoryValue();
        this.cash += value;
        this.inventory.clear();
        
        if (this.gameState) {
            this.gameState.sellInventory();
        }
        
        return value;
    }

    dropValuables(percentage) {
        for (const [type, amount] of this.inventory) {
            const toDrop = Math.floor(amount * percentage);
            if (toDrop > 0) {
                const remaining = amount - toDrop;
                if (remaining > 0) {
                    this.inventory.set(type, remaining);
                } else {
                    this.inventory.delete(type);
                }
                
                if (this.gameState) {
                    this.gameState.removeFromInventory(type, toDrop);
                }
            }
        }
    }

    // Hazard handling
    triggerHazard(hazardType, x, y) {
        switch (hazardType) {
            case 'waterSpring':
                this.handleWaterSpring(x, y);
                break;
            case 'caveCollapse':
                this.handleCaveCollapse(x, y);
                break;
            case 'gasPocket':
                this.handleGasPocket(x, y);
                break;
        }
    }

    handleWaterSpring(x, y) {
        // Take damage
        this.takeDamage(20);
        
        // Lose valuables
        this.dropValuables(0.3);
        
        // Force upward movement
        this.velocity.y = -8;
        
        // Trigger world flood effect
        this.world.triggerHazard(x, y, 'waterSpring');
    }

    handleCaveCollapse(x, y) {
        // Take damage
        this.takeDamage(15);
        
        // Lose valuables
        this.dropValuables(0.2);
        
        // Trigger world collapse effect
        this.world.triggerHazard(x, y, 'caveCollapse');
    }

    handleGasPocket(x, y) {
        // Placeholder for gas pocket effect
        this.world.triggerHazard(x, y, 'gasPocket');
    }

    // State management
    die() {
        if (this.gameState) {
            this.gameState.gameOver();
        }
    }

    reset() {
        this.position = { x: 10, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.health = this.maxHealth;
        this.fuel = this.maxFuel;
        this.inventory.clear();
        this.cancelMining();
    }

    teleportTo(x, y) {
        this.position.x = x * TILE_SIZE;
        this.position.y = y * TILE_SIZE;
        this.velocity = { x: 0, y: 0 };
        this.updateGridPosition();
    }

    // Animation
    updateAnimation(deltaTime) {
        if (this.isMoving || this.isMining) {
            this.animationTimer += deltaTime;
            if (this.animationTimer >= 100) {
                this.animationTimer = 0;
                this.animationFrame = (this.animationFrame + 1) % 4;
            }
        } else {
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
    }

    // Input handling
    handleInput(input) {
        this.inputState = input;
        
        // Handle mining input
        if (input.mine && !this.isMining) {
            // Determine mining direction based on input or facing
            let direction = { x: 0, y: 0 };
            
            if (input.up) direction.y = -1;
            else if (input.down) direction.y = 1;
            else if (input.left) direction.x = -1;
            else if (input.right) direction.x = 1;
            else direction.x = this.facing === 'right' ? 1 : -1;
            
            this.startMining(direction);
        } else if (!input.mine) {
            this.cancelMining();
        }
    }

    // Sync with game state
    syncWithGameState() {
        if (!this.gameState) return;
        
        // Update game state with current values
        this.gameState.updatePlayerPosition(this.gridPosition.x, this.gridPosition.y);
        this.gameState.player.velocity = { ...this.velocity };
        this.gameState.player.facing = this.facing;
        this.gameState.player.isGrounded = this.isGrounded;
        this.gameState.player.isMining = this.isMining;
        this.gameState.player.miningProgress = this.miningProgress;
        this.gameState.player.miningTarget = this.miningTarget ? { ...this.miningTarget } : null;
    }

    // Apply upgrades from game state
    applyUpgrades() {
        if (!this.gameState) return;
        
        const fuelLevel = this.gameState.upgrades.fuelTank;
        const carryLevel = this.gameState.upgrades.carryingCapacity;
        
        this.maxFuel = UPGRADES.fuelTank.baseValue + (fuelLevel * UPGRADES.fuelTank.increment);
        this.inventoryCapacity = UPGRADES.carryingCapacity.baseValue + (carryLevel * UPGRADES.carryingCapacity.increment);
    }
}

// Import to fix reference
import { TILE_SIZE } from '../core/Constants.js';