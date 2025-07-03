import { 
    PLAYER_SPEED, 
    SURFACE_Y, 
    PLAYER_SIZE, 
    TILE_SIZE,
    BUILDINGS,
    BUILDING_WIDTH,
    ELEVATOR_SHAFT_WIDTH,
    ELEVATOR_PROXIMITY,
    MAX_DEPTH,
    TILE_PROPERTIES,
    TILE_TYPES,
    ORE_QUANTITY_CHANCES
} from '../core/Constants.js';

export class Player {
    constructor(gameState, world) {
        this.gameState = gameState;
        this.world = world;
        this.miningMessage = null;
        this.miningMessageTime = 0;
        
        // Falling tracking
        this.isFalling = false;
        this.fallStartY = 0;
        this.fallDistance = 0;
        this.lastGroundY = 0;
        this.impactEffect = null;
        this.impactEffectTime = 0;
        this.fallVelocityX = 0; // Store horizontal velocity during fall
        
        // Grid alignment
        this.targetGridX = null;
        this.isAligning = false;
        this.alignmentSpeed = 300; // pixels per second for alignment
        
        // Interaction tracking
        this.interactPressed = false;
        
        // Track last tile position for detection
        this.lastTileX = null;
        this.lastTileY = null;
        
        // Track which tiles we've already triggered detection from
        this.detectionTriggeredFrom = new Set();
    }
    
    update(deltaTime, input) {
        const player = this.gameState.player;
        const elevator = this.gameState.elevator;
        const moveAmount = PLAYER_SPEED * deltaTime;
        
        // Reset velocity
        player.vx = 0;
        player.vy = 0;
        
        // Check input
        let left = input.keys['arrowleft'] || input.keys['a'] || input.touches.left;
        let right = input.keys['arrowright'] || input.keys['d'] || input.touches.right;
        let up = input.keys['arrowup'] || input.keys['w'] || input.touches.up;
        let down = input.keys['arrowdown'] || input.keys['s'] || input.touches.down;
        const interact = input.keys[' '] || input.keys['e'];
        
        // Check for building interactions - only on initial press
        if (interact && !player.isUnderground && !this.interactPressed) {
            this.checkBuildingInteraction();
            this.interactPressed = true;
        } else if (!interact) {
            this.interactPressed = false;
        }
        
        // Horizontal movement - disabled when falling
        if (!this.isFalling) {
            if (left) player.vx = -PLAYER_SPEED;
            if (right) player.vx = PLAYER_SPEED;
        } else {
            // Maintain horizontal velocity when falling
            player.vx = this.fallVelocityX;
        }
        
        // Check if player is at elevator
        const elevatorBuilding = BUILDINGS.elevator;
        const atElevator = Math.abs(player.x - (elevatorBuilding.x + BUILDING_WIDTH/2)) < ELEVATOR_PROXIMITY;
        
        if (!player.isUnderground) {
            // Surface movement
            player.y = SURFACE_Y;
            
            // Vertical movement at elevator
            if (atElevator) {
                if (down && elevator.maxDepth > 0) {
                    this.gameState.enterUnderground();
                    // Reset falling state when entering underground
                    this.isFalling = false;
                    this.fallVelocityX = 0;
                }
            }
        } else {
            // Underground movement
            if (atElevator && !this.isFalling) {
                // Elevator shaft movement - disabled while falling
                if (up) {
                    if (player.depth <= 1) {
                        // At top of mine (depth 1), return to surface
                        this.gameState.returnToSurface();
                        // Reset falling state when returning to surface
                        this.isFalling = false;
                        this.fallVelocityX = 0;
                    } else {
                        // Normal upward movement
                        player.vy = -PLAYER_SPEED;
                        player.depth = Math.max(1, player.depth - moveAmount / TILE_SIZE);
                    }
                }
                if (down && player.depth < elevator.maxDepth) {
                    player.vy = PLAYER_SPEED;
                    player.depth = Math.min(elevator.maxDepth, player.depth + moveAmount / TILE_SIZE);
                }
            } else {
                // Regular underground movement with auto-mining
                
                // Since surface is now at Y=192 and row 6 is border blocks,
                // we don't need to restrict movement at 1m depth anymore
                // The border blocks will naturally prevent horizontal movement
                
                // Track if player was on ground
                const wasOnGround = this.isOnGround();
                
                // Check if actively mining downward
                const isMiningDown = down && wasOnGround;
                
                // Only apply gravity if not actively mining downward and not aligning
                if (!isMiningDown && !this.isAligning) {
                    // Apply gravity with smooth acceleration
                    const gravityAccel = 27000; // pixels per second squared (18x original speed)
                    player.vy += gravityAccel * deltaTime;
                    player.vy = Math.min(player.vy, 21600); // Terminal velocity (18x original)
                }
                
                // Grid alignment for underground movement
                const currentGridX = Math.round(player.x / TILE_SIZE) * TILE_SIZE;
                const currentGridY = Math.round(player.y / TILE_SIZE) * TILE_SIZE;
                const playerGridOffsetX = Math.abs(player.x - currentGridX);
                const playerGridOffsetY = Math.abs(player.y - currentGridY);
                
                // Check if player is actively moving vertically
                const isMovingVertically = player.vy !== 0 || down;
                
                // Snap to Y grid when on ground to prevent overlapping rows
                if (wasOnGround && playerGridOffsetY > 1 && !down && !this.isAligning) {
                    // Always snap Y position to prevent mining multiple rows
                    player.y = currentGridY;
                }
                
                // If player is on ground and trying to move down, determine which column to mine
                if (down && wasOnGround && player.vy === 0 && !this.isAligning) {
                    // Only check alignment if we're not already moving down or aligning
                    // Find which tile the player is currently over
                    const playerTileX = Math.floor(player.x / TILE_SIZE);
                    const tileCenter = (playerTileX * TILE_SIZE) + (TILE_SIZE / 2);
                    const distanceFromCenter = Math.abs(player.x - tileCenter);
                    
                    // If far from center, start alignment
                    if (distanceFromCenter > 2) {
                        this.isAligning = true;
                        this.targetGridX = tileCenter;
                        player.vy = 0; // Stop any vertical movement
                    } else {
                        // Close enough - snap and mine
                        player.x = tileCenter;
                        player.vy = PLAYER_SPEED * 0.7;
                    }
                }
                
                // Cancel alignment if player tries to move horizontally or releases down
                if (this.isAligning && (left || right || !down)) {
                    this.isAligning = false;
                    this.targetGridX = null;
                }
                
                // Handle grid alignment
                if (this.isAligning && this.targetGridX !== null) {
                    const alignDiff = this.targetGridX - player.x;
                    
                    // Use larger threshold to prevent oscillation
                    if (Math.abs(alignDiff) > 2) {
                        // Move towards aligned position smoothly
                        player.vx = Math.sign(alignDiff) * this.alignmentSpeed;
                        // Ensure vertical velocity stays zero during alignment
                        player.vy = 0;
                    } else {
                        // Close enough, snap to grid and start mining
                        player.x = this.targetGridX;
                        player.vx = 0;
                        
                        // If still pressing down, start mining
                        if (down) {
                            player.vy = PLAYER_SPEED * 0.7;
                            this.isAligning = false;
                            this.targetGridX = null;
                        }
                    }
                }
                
                // Apply alignment movement
                if (this.isAligning && player.vx !== 0) {
                    player.x += player.vx * deltaTime;
                } else if (!this.isAligning) {
                    // Normal horizontal movement when not aligning
                    if (player.vx !== 0 && !down) {
                        const newX = player.x + player.vx * deltaTime;
                        
                        // Check if we can move horizontally
                        // When falling, don't mine - just check collision
                        const canMove = this.checkAndMine(newX, player.y, player.x, player.y, !this.isFalling);
                        
                        if (canMove) {
                            player.x = newX;
                            
                            // After moving horizontally, check if we should start falling
                            if (!this.isOnGround() && !this.isFalling && !isMiningDown) {
                                this.isFalling = true;
                                this.fallStartY = player.y;
                                this.fallVelocityX = player.vx; // Store horizontal velocity
                            }
                        } else {
                            // Hit a wall
                            if (this.isFalling) {
                                // Stop lateral movement when hitting wall during fall
                                this.fallVelocityX = 0;
                                player.vx = 0;
                            }
                            // Hit a wall - check if we need to adjust Y position to fit through
                            const tileY = Math.floor(player.y / TILE_SIZE);
                            const alignedY = tileY * TILE_SIZE;
                            
                            // Try moving at aligned Y position
                            if (Math.abs(player.y - alignedY) < TILE_SIZE * 0.3 && !this.isFalling) {
                                // Close enough to snap to aligned position (but not when falling)
                                if (this.checkAndMine(newX, alignedY, player.x, alignedY, true)) {
                                    player.x = newX;
                                    player.y = alignedY;
                                    
                                    // Check for falling after adjustment
                                    if (!this.isOnGround() && !this.isFalling && !isMiningDown) {
                                        this.isFalling = true;
                                        this.fallStartY = player.y;
                                        this.fallVelocityX = player.vx; // Store horizontal velocity
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Then try vertical movement (only if not currently aligning horizontally)
                const oldY = player.y;
                if (player.vy !== 0 && !this.isAligning) {
                    const newY = player.y + player.vy * deltaTime;
                    // Only mine vertically if pressing down, otherwise just check collision
                    const canMineVertically = down && player.vy > 0 && !this.isFalling;
                    if (this.checkAndMine(player.x, newY, player.x, player.y, canMineVertically)) {
                        player.y = newY;
                        
                        // Track falling only if not intentionally mining down
                        if (!wasOnGround && player.vy > 0 && !isMiningDown) {
                            if (!this.isFalling) {
                                this.isFalling = true;
                                this.fallStartY = oldY;
                                this.fallVelocityX = player.vx; // Store horizontal velocity
                            }
                        }
                    } else {
                        // Hit ground
                        if (this.isFalling && player.vy > 0) {
                            this.handleFallImpact();
                        }
                        player.vy = 0;
                        this.isFalling = false;
                        this.fallVelocityX = 0; // Reset fall velocity
                        this.lastGroundY = player.y;
                        
                        // Snap to tile grid when stopping vertical movement to prevent mining multiple rows
                        const tileY = Math.round(player.y / TILE_SIZE) * TILE_SIZE;
                        if (Math.abs(player.y - tileY) > 0.1) {
                            player.y = tileY;
                        }
                    }
                }
            }
        }
        
        // Apply movement for surface and elevator
        if (!player.isUnderground || atElevator) {
            player.x += player.vx * deltaTime;
            if (player.isUnderground && atElevator) {
                // Depth 1 starts at row 7 (skip border row 6)
                player.y = SURFACE_Y + ((player.depth + 1) * TILE_SIZE);
                // Reset falling if in elevator shaft
                if (this.isFalling) {
                    this.isFalling = false;
                    this.fallVelocityX = 0;
                }
            }
        }
        
        // Update depth based on Y position
        if (player.isUnderground && !atElevator) {
            const surfaceRow = Math.floor(SURFACE_Y / TILE_SIZE); // Row 6
            const currentRow = Math.floor(player.y / TILE_SIZE);
            // Depth starts at 1 when in row 7
            player.depth = currentRow - surfaceRow - 1;
        }
        
        // Track current tile position and handle detection
        // Use player center for tile calculation (player.y is bottom of sprite)
        const playerCenterY = player.y - PLAYER_SIZE / 2;
        const currentTileX = Math.floor(player.x / TILE_SIZE);
        const currentTileY = Math.floor(playerCenterY / TILE_SIZE);
        
        // Check if we've moved to a new tile
        if (currentTileX !== this.lastTileX || currentTileY !== this.lastTileY) {
            this.lastTileX = currentTileX;
            this.lastTileY = currentTileY;
            
            // Reveal current tile
            this.world.revealTile(currentTileX, currentTileY);
            
            // Trigger detection if not already done from this tile
            const tileKey = `${currentTileX},${currentTileY}`;
            if (!this.detectionTriggeredFrom.has(tileKey)) {
                this.detectionTriggeredFrom.add(tileKey);
                this.world.detectAdjacentTiles(currentTileX, currentTileY);
            }
        }
        
        // Initialize last tile position if not set
        if (this.lastTileX === null || this.lastTileY === null) {
            this.lastTileX = currentTileX;
            this.lastTileY = currentTileY;
        }
        
        // Update mining message timer
        if (this.miningMessageTime > 0) {
            this.miningMessageTime -= deltaTime;
            if (this.miningMessageTime <= 0) {
                this.miningMessage = null;
            }
        }
        
        // Update impact effect timer
        if (this.impactEffectTime > 0) {
            this.impactEffectTime -= deltaTime * 1000; // Convert to milliseconds
            if (this.impactEffectTime <= 0) {
                this.impactEffect = null;
                this.impactEffectTime = 0;
            }
        }
        
        // Boundaries
        player.x = Math.max(PLAYER_SIZE/2, Math.min(2000, player.x)); // Arbitrary max for now
    }
    
    isAtElevator() {
        const player = this.gameState.player;
        const elevatorBuilding = BUILDINGS.elevator;
        return Math.abs(player.x - (elevatorBuilding.x + BUILDING_WIDTH/2)) < ELEVATOR_PROXIMITY;
    }
    
    getPosition() {
        return {
            x: this.gameState.player.x,
            y: this.gameState.player.y
        };
    }
    
    getDepth() {
        return this.gameState.player.depth;
    }
    
    checkAndMine(newX, newY, oldX, oldY, canMine = false) {
        const player = this.gameState.player;
        
        // Check if we're in the elevator shaft area
        const elevatorLeft = (BUILDINGS.elevator.x + (BUILDING_WIDTH - ELEVATOR_SHAFT_WIDTH) / 2);
        const elevatorRight = elevatorLeft + ELEVATOR_SHAFT_WIDTH;
        
        // If player is entirely within elevator shaft bounds, allow movement
        if (newX - PLAYER_SIZE * 0.4 >= elevatorLeft && 
            newX + PLAYER_SIZE * 0.4 <= elevatorRight &&
            player.isUnderground) {
            return true; // No collision in elevator shaft
        }
        
        // Check if we're moving downward
        const movingDown = newY > oldY;
        
        // Get player bounds - player is centered on X, bottom-aligned on Y
        const playerWidth = PLAYER_SIZE * 0.8; // Slightly smaller width for easier movement
        const playerLeft = newX - playerWidth/2;
        const playerRight = newX + playerWidth/2;
        const playerTop = newY - PLAYER_SIZE + 1; // Small offset to prevent ceiling collision
        const playerBottom = newY - 1; // Small offset to ensure proper ground contact
        
        // Check tiles that player would overlap
        let startTileX = Math.floor(playerLeft / TILE_SIZE);
        let endTileX = Math.floor(playerRight / TILE_SIZE);
        const startTileY = Math.floor(playerTop / TILE_SIZE);
        const endTileY = Math.floor(playerBottom / TILE_SIZE);
        
        // If mining downward and we can mine, only mine the single column we're aligned to
        if (movingDown && canMine) {
            // Calculate which tile the player is centered in
            const alignedTileX = Math.floor(newX / TILE_SIZE);
            startTileX = alignedTileX;
            endTileX = alignedTileX;
        }
        
        
        for (let ty = startTileY; ty <= endTileY; ty++) {
            for (let tx = startTileX; tx <= endTileX; tx++) {
                const tile = this.world.getTile(tx, ty);
                if (tile) {
                    // Check if tile is indestructible
                    const tileProps = TILE_PROPERTIES[tile.type];
                    if (tileProps.isIndestructible) {
                        // For border tiles, always block movement regardless of mining ability
                        return false; // Block movement completely
                    }
                    
                    // If we can't mine, just return collision
                    if (!canMine) {
                        return false; // Block movement, tile is solid
                    }
                    
                    // Check depth limit
                    if (player.depth >= MAX_DEPTH) {
                        this.miningMessage = 'Depth limit reached! Purchase deeper license.';
                        this.miningMessageTime = 3000; // Show for 3 seconds
                        return false; // Block movement
                    }
                    
                    // Calculate actual energy cost with upgrades
                    let actualEnergyCost = tile.energyCost;
                    if (this.gameState.upgrades.improvedPickaxe) {
                        actualEnergyCost = Math.floor(actualEnergyCost * 0.9); // 10% reduction
                    }
                    
                    // Check energy
                    if (this.gameState.resources.energy < actualEnergyCost) {
                        this.miningMessage = 'Not enough energy!';
                        this.miningMessageTime = 2000;
                        return false; // Block movement
                    }
                    
                    // Mine the tile
                    this.mineTile(tx, ty, tile);
                    return false; // Block movement this frame (mining takes time)
                }
            }
        }
        
        return true; // No collision, allow movement
    }
    
    mineTile(x, y, tile) {
        // Calculate actual energy cost with upgrades
        let actualEnergyCost = tile.energyCost;
        if (this.gameState.upgrades.improvedPickaxe) {
            actualEnergyCost = Math.floor(actualEnergyCost * 0.9); // 10% reduction
        }
        
        // Consume energy
        this.gameState.resources.energy -= actualEnergyCost;
        
        // Remove the tile
        this.world.removeTile(x, y);
        
        // Play mining sound
        if (this.gameState.audioManager && this.gameState.audioManager.initialized) {
            // Get tile type name (e.g., "DIRT", "STONE", etc.)
            const tileTypeName = Object.keys(TILE_TYPES).find(key => TILE_TYPES[key] === tile.type);
            if (tileTypeName) {
                this.gameState.audioManager.playMiningSound(tileTypeName);
            }
        }
        
        // Show mining feedback
        const tileProps = TILE_PROPERTIES[tile.type];
        const tileName = tileProps.name;
        
        if (tileProps.isOre) {
            // Roll for quantity
            const quantity = this.rollOreQuantity();
            
            // Add to inventory based on tile type
            switch(tile.type) {
                case TILE_TYPES.IRON:
                    this.gameState.inventory.iron += quantity;
                    break;
                case TILE_TYPES.COPPER:
                    this.gameState.inventory.copper += quantity;
                    break;
                case TILE_TYPES.SILVER:
                    this.gameState.inventory.silver += quantity;
                    break;
                case TILE_TYPES.GOLD:
                    this.gameState.inventory.gold += quantity;
                    break;
            }
            
            // Big message for valuable ores
            if (quantity === 1) {
                this.miningMessage = `💎 ${tileName.toUpperCase()} FOUND! 💎`;
                this.miningMessageType = 'ore';
            } else {
                // Extra big message for multiple ores
                this.miningMessage = `💎💎 ${tileName.toUpperCase()} x${quantity} FOUND! 💎💎`;
                this.miningMessageType = 'ore-multi';
            }
            this.miningMessageTime = quantity > 1 ? 4000 : 3000; // Show longer for multiple
            this.miningMessageColor = tileProps.color;
        } else {
            // Regular message for dirt/clay/stone
            this.miningMessage = `Mined ${tileName}`;
            this.miningMessageTime = 1000;
            this.miningMessageType = 'regular';
            this.miningMessageColor = null;
        }
    }
    
    rollOreQuantity() {
        const roll = Math.random() * 100;
        
        if (roll < ORE_QUANTITY_CHANCES.ten) {
            return 10;
        } else if (roll < ORE_QUANTITY_CHANCES.ten + ORE_QUANTITY_CHANCES.five) {
            return 5;
        } else if (roll < ORE_QUANTITY_CHANCES.ten + ORE_QUANTITY_CHANCES.five + ORE_QUANTITY_CHANCES.two) {
            return 2;
        } else {
            return 1;
        }
    }
    
    getMiningMessage() {
        return this.miningMessage;
    }
    
    getMiningMessageType() {
        return this.miningMessageType || 'regular';
    }
    
    getMiningMessageColor() {
        return this.miningMessageColor;
    }
    
    isOnGround() {
        const player = this.gameState.player;
        // Check if there's a tile directly below the player
        const playerBottom = player.y;
        const playerWidth = PLAYER_SIZE * 0.8;
        const checkY = Math.floor((playerBottom + 1) / TILE_SIZE);
        
        // Check left and right edges of player
        const leftX = Math.floor((player.x - playerWidth/2) / TILE_SIZE);
        const rightX = Math.floor((player.x + playerWidth/2) / TILE_SIZE);
        
        // Player is on ground if either edge has a tile below
        return this.world.hasTile(leftX, checkY) || this.world.hasTile(rightX, checkY);
    }
    
    handleFallImpact() {
        const player = this.gameState.player;
        const fallDistance = player.y - this.fallStartY;
        const blocksFallen = Math.floor(fallDistance / TILE_SIZE);
        
        // Calculate damage based on blocks fallen
        let damage = 0;
        let message = '';
        
        const feetFallen = blocksFallen * 10; // 10 feet per block
        
        if (blocksFallen <= 1) {
            // Safe fall - no damage
            return;
        } else if (blocksFallen === 2) {
            damage = Math.floor(this.gameState.resources.maxHealth * 0.2); // 20% damage
            message = `Ouch! Fell ${feetFallen} feet (-${damage} HP)`;
            this.impactEffect = 'light';
        } else if (blocksFallen === 3) {
            damage = Math.floor(this.gameState.resources.maxHealth * 0.5); // 50% damage
            message = `Ow! Fell ${feetFallen} feet (-${damage} HP)`;
            this.impactEffect = 'medium';
        } else {
            damage = this.gameState.resources.maxHealth; // 100% damage (death)
            message = `Fatal fall! Fell ${feetFallen} feet`;
            this.impactEffect = 'heavy';
        }
        
        // Apply damage
        if (damage > 0) {
            this.gameState.resources.health = Math.max(0, this.gameState.resources.health - damage);
            this.miningMessage = message;
            this.miningMessageTime = 3000;
            this.impactEffectTime = 500; // Half second impact effect
            
            // Check for death
            if (this.gameState.resources.health <= 0) {
                this.handleDeath();
            }
        }
        
        // Reset fall tracking
        this.fallDistance = 0;
    }
    
    getImpactEffect() {
        return this.impactEffect;
    }
    
    checkBuildingInteraction() {
        const player = this.gameState.player;
        
        // Check each building
        for (const [key, building] of Object.entries(BUILDINGS)) {
            const buildingCenter = building.x + BUILDING_WIDTH / 2;
            const distance = Math.abs(player.x - buildingCenter);
            
            if (distance < BUILDING_WIDTH / 2) {
                // Player is at this building
                if (key === 'medical') {
                    this.restAtHospital();
                } else if (key === 'assayer') {
                    this.openAssayer();
                } else if (key === 'store') {
                    this.openStore();
                }
                // Add other building interactions here later
                break;
            }
        }
    }
    
    openAssayer() {
        if (this.gameState.assayerMenu) {
            this.gameState.assayerMenu.open();
        }
    }
    
    openStore() {
        if (this.gameState.storeMenu) {
            this.gameState.storeMenu.open();
        }
    }
    
    restAtHospital() {
        const cost = 50;
        
        // Check if player has enough money
        if (this.gameState.resources.cash < cost) {
            this.miningMessage = `Not enough money! Hospital visit costs $${cost}`;
            this.miningMessageTime = 2000;
            this.miningMessageType = 'regular';
            return;
        }
        
        // Deduct cost
        this.gameState.resources.cash -= cost;
        
        // Restore health
        this.gameState.resources.health = this.gameState.resources.maxHealth;
        
        // Reset discovery attempts
        this.world.resetDiscoveryAttempts();
        this.detectionTriggeredFrom.clear(); // Also reset player's detection tracking
        
        // Show message
        this.miningMessage = `Rested at hospital! Health restored and discovery reset. (-$${cost})`;
        this.miningMessageTime = 3000;
        this.miningMessageType = 'regular';
    }
    
    handleDeath() {
        const { resources, inventory } = this.gameState;
        
        // Calculate losses (80% of cash and ores, but keep energy)
        const cashLost = Math.floor(resources.cash * 0.8);
        const remainingCash = resources.cash - cashLost;
        
        // Store ore losses for message
        const oreLosses = [];
        const oreTypes = ['iron', 'copper', 'silver', 'gold'];
        for (const ore of oreTypes) {
            if (inventory[ore] > 0) {
                const lost = Math.floor(inventory[ore] * 0.8);
                if (lost > 0) {
                    oreLosses.push(`${lost} ${ore}`);
                    inventory[ore] = inventory[ore] - lost;
                }
            }
        }
        
        // Apply losses
        resources.cash = remainingCash;
        resources.health = 10; // Minimal health
        // Energy is kept (not part of the 80% loss)
        
        // Return to surface at hospital
        this.gameState.returnToSurface();
        this.gameState.player.x = BUILDINGS.medical.x + BUILDING_WIDTH / 2;
        
        // Reset falling state
        this.isFalling = false;
        this.fallVelocityX = 0;
        
        // Show death message
        this.miningMessage = "It ain't cheap bringing you back to life. It cost you 80% of everything you owned to pay the hospital bill!";
        this.miningMessageTime = 6000; // Show longer
        this.miningMessageType = 'death';
        
        // Save the game state
        this.gameState.save();
    }
}