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
    ORE_QUANTITY_CHANCES,
    WORLD
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
        
        // Teleport effect
        this.teleportEffect = false;
        this.teleportEffectTime = 0;
        
        // Grid alignment
        this.targetGridX = null;
        this.isAligning = false;
        this.alignmentSpeed = 300; // pixels per second for alignment
        
        // Interaction tracking
        this.interactPressed = false;
        this.energyDrinkPressed = false;
        this.luckyCharmPressed = false;
        this.explosiveChargePressed = false;
        this.teleportPressed = false;
        
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
        const useEnergyDrink = input.keys['1'];
        const useLuckyCharm = input.keys['2'];
        const useExplosiveCharge = input.keys['3'];
        const useTeleport = input.keys['t'];
        
        // Check for building interactions - only on initial press
        if (interact && !player.isUnderground && !this.interactPressed) {
            this.checkBuildingInteraction();
            this.interactPressed = true;
        } else if (!interact) {
            this.interactPressed = false;
        }
        
        // Check for consumable usage - only on initial press
        if (useEnergyDrink && !this.energyDrinkPressed) {
            this.useEnergyDrink();
            this.energyDrinkPressed = true;
        } else if (!useEnergyDrink) {
            this.energyDrinkPressed = false;
        }
        
        if (useLuckyCharm && !this.luckyCharmPressed) {
            this.useLuckyCharm();
            this.luckyCharmPressed = true;
        } else if (!useLuckyCharm) {
            this.luckyCharmPressed = false;
        }
        
        if (useExplosiveCharge && !this.explosiveChargePressed) {
            this.useExplosiveCharge();
            this.explosiveChargePressed = true;
        } else if (!useExplosiveCharge) {
            this.explosiveChargePressed = false;
        }
        
        if (useTeleport && !this.teleportPressed) {
            this.teleportToSurface();
            this.teleportPressed = true;
        } else if (!useTeleport) {
            this.teleportPressed = false;
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
                        const newDepth = player.depth - moveAmount / TILE_SIZE;
                        player.depth = Math.max(1, newDepth);
                        // Update Y position immediately
                        player.y = SURFACE_Y + ((player.depth + 1) * TILE_SIZE);
                    }
                }
                if (down && player.depth < elevator.maxDepth) {
                    player.vy = PLAYER_SPEED;
                    const newDepth = player.depth + moveAmount / TILE_SIZE;
                    player.depth = Math.min(elevator.maxDepth, newDepth);
                    // Update Y position immediately
                    player.y = SURFACE_Y + ((player.depth + 1) * TILE_SIZE);
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
                // Position is already updated in the elevator movement code above
                // Reset falling if in elevator shaft
                if (this.isFalling) {
                    this.isFalling = false;
                    this.fallVelocityX = 0;
                }
            }
        }
        
        // Track position before update for statistics
        const oldX = player.x;
        const oldY = player.y;
        const oldDepth = player.depth;
        
        // Update depth based on Y position
        if (player.isUnderground && !atElevator) {
            const surfaceRow = Math.floor(SURFACE_Y / TILE_SIZE); // Row 6
            const currentRow = Math.floor(player.y / TILE_SIZE);
            // Depth starts at 1 when in row 7
            player.depth = currentRow - surfaceRow - 1;
        }
        
        // Update statistics
        if (this.gameState.statistics) {
            // Track depth
            if (player.depth !== oldDepth) {
                this.gameState.statistics.updateDepth(player.depth);
            }
            
            // Track distance moved
            const deltaX = Math.abs(player.x - oldX);
            const deltaY = Math.abs(player.y - oldY);
            if (deltaX > 0 || deltaY > 0) {
                this.gameState.statistics.updateDistance(deltaX, deltaY);
            }
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
        
        // Update teleport effect timer
        if (this.teleportEffectTime > 0) {
            this.teleportEffectTime -= deltaTime * 1000;
            if (this.teleportEffectTime <= 0) {
                this.teleportEffect = false;
                this.teleportEffectTime = 0;
            }
        }
        
        // Boundaries
        player.x = Math.max(PLAYER_SIZE/2, Math.min((WORLD.width - 1) * TILE_SIZE - PLAYER_SIZE/2, player.x));
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
        
        // Check if we're moving downward or upward
        const movingDown = newY > oldY;
        const movingUp = newY < oldY;
        
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
                    
                    // Check depth limit based on license
                    const maxDepth = this.gameState.licenseManager ? 
                        this.gameState.licenseManager.getMaxDepth() : MAX_DEPTH;
                    
                    if (player.depth >= maxDepth) {
                        this.miningMessage = 'Depth limit reached! Purchase deeper license.';
                        this.miningMessageTime = 3000; // Show for 3 seconds
                        return false; // Block movement
                    }
                    
                    // Calculate actual energy cost with upgrades
                    let actualEnergyCost = tile.energyCost;
                    
                    // Apply best pickaxe bonus
                    if (this.gameState.upgrades.diamondPickaxe) {
                        actualEnergyCost = Math.floor(actualEnergyCost * 0.5); // 50% reduction
                    } else if (this.gameState.upgrades.ironPickaxe) {
                        actualEnergyCost = Math.floor(actualEnergyCost * 0.8); // 20% reduction
                    } else if (this.gameState.upgrades.improvedPickaxe) {
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
        
        // Apply best pickaxe bonus
        if (this.gameState.upgrades.ultimateWeapon) {
            actualEnergyCost = Math.floor(actualEnergyCost * 0.25); // 75% reduction
        } else if (this.gameState.upgrades.diamondPickaxe) {
            actualEnergyCost = Math.floor(actualEnergyCost * 0.5); // 50% reduction
        } else if (this.gameState.upgrades.ironPickaxe) {
            actualEnergyCost = Math.floor(actualEnergyCost * 0.8); // 20% reduction
        } else if (this.gameState.upgrades.improvedPickaxe) {
            actualEnergyCost = Math.floor(actualEnergyCost * 0.9); // 10% reduction
        }
        
        // Consume energy
        this.gameState.resources.energy -= actualEnergyCost;
        
        // Remove the tile
        this.world.removeTile(x, y);
        
        // Decrement lucky charm buff if active
        if (this.gameState.buffs.luckyCharm.active) {
            this.gameState.buffs.luckyCharm.tilesRemaining--;
            if (this.gameState.buffs.luckyCharm.tilesRemaining <= 0) {
                this.gameState.buffs.luckyCharm.active = false;
                this.miningMessage = "Lucky Charm buff expired!";
                this.miningMessageTime = 2000;
                this.miningMessageType = 'regular';
            }
        }
        
        // Play mining sound
        if (this.gameState.audioManager && this.gameState.audioManager.initialized) {
            // Get tile type name (e.g., "DIRT", "STONE", etc.)
            const tileTypeName = Object.keys(TILE_TYPES).find(key => TILE_TYPES[key] === tile.type);
            if (tileTypeName) {
                this.gameState.audioManager.playMiningSound(tileTypeName);
            }
        }
        
        // Track tile mined for achievements and statistics
        this.gameState.stats.totalTilesMined++;
        
        // Track for statistics
        if (this.gameState.statistics) {
            const tileTypeName = Object.keys(TILE_TYPES).find(key => TILE_TYPES[key] === tile.type)?.toLowerCase() || 'unknown';
            this.gameState.statistics.updateMiningStats(tileTypeName, TILE_PROPERTIES[tile.type].isOre);
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
                    if (this.gameState.statistics) {
                        this.gameState.statistics.updateOreCollection('iron', quantity);
                    }
                    break;
                case TILE_TYPES.COPPER:
                    this.gameState.inventory.copper += quantity;
                    this.gameState.stats.copperCollected += quantity;
                    if (this.gameState.statistics) {
                        this.gameState.statistics.updateOreCollection('copper', quantity);
                    }
                    break;
                case TILE_TYPES.SILVER:
                    this.gameState.inventory.silver += quantity;
                    this.gameState.stats.silverCollected += quantity;
                    if (this.gameState.statistics) {
                        this.gameState.statistics.updateOreCollection('silver', quantity);
                    }
                    break;
                case TILE_TYPES.GOLD:
                    this.gameState.inventory.gold += quantity;
                    this.gameState.stats.goldCollected += quantity;
                    if (this.gameState.statistics) {
                        this.gameState.statistics.updateOreCollection('gold', quantity);
                    }
                    break;
            }
            
            // Track ore collected for achievements
            this.gameState.stats.totalOresCollected += quantity;
            
            // Check lucky strike achievement
            if (this.gameState.achievementManager) {
                this.gameState.achievementManager.checkLuckyStrike(true);
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
            
            // Check lucky strike achievement (not ore)
            if (this.gameState.achievementManager) {
                this.gameState.achievementManager.checkLuckyStrike(false);
            }
        }
    }
    
    rollOreQuantity() {
        const roll = Math.random() * 100;
        let quantity;
        
        if (roll < ORE_QUANTITY_CHANCES.ten) {
            quantity = 10;
        } else if (roll < ORE_QUANTITY_CHANCES.ten + ORE_QUANTITY_CHANCES.five) {
            quantity = 5;
        } else if (roll < ORE_QUANTITY_CHANCES.ten + ORE_QUANTITY_CHANCES.five + ORE_QUANTITY_CHANCES.two) {
            quantity = 2;
        } else {
            quantity = 1;
        }
        
        // Apply lucky charm buff if active
        if (this.gameState.buffs.luckyCharm.active) {
            quantity = Math.floor(quantity * 1.5);
        }
        
        return quantity;
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
        
        // Apply reinforced boots reduction if owned
        if (this.gameState.upgrades.reinforcedBoots && damage > 0) {
            damage = Math.floor(damage * 0.5); // 50% damage reduction
            message += ' (Boots reduced damage!)';
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
        
        // Check Rock Bottom achievement
        if (this.gameState.achievementManager) {
            this.gameState.achievementManager.checkRockBottom();
        }
        
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
        
        // Track death statistics
        if (this.gameState.statistics) {
            this.gameState.statistics.updateSurvivalStats('death', 0, this.gameState.player.depth);
            this.gameState.statistics.updateEconomicStats('lost', cashLost);
        }
        
        // Track for legacy stats
        this.gameState.stats.totalDeaths++;
        
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
    
    useEnergyDrink() {
        const { resources, consumables } = this.gameState;
        
        if (consumables.energyDrinks > 0) {
            // Add 100 energy, up to max
            const oldEnergy = resources.energy;
            resources.energy = Math.min(resources.energy + 100, resources.maxEnergy);
            const energyGained = resources.energy - oldEnergy;
            
            // Consume the drink
            consumables.energyDrinks -= 1;
            
            // Show message
            this.miningMessage = `Used Energy Drink! +${energyGained} energy`;
            this.miningMessageTime = 2000;
            this.miningMessageType = 'regular';
            
            // Save state
            this.gameState.save();
        } else {
            this.miningMessage = "No Energy Drinks! Buy them at the store.";
            this.miningMessageTime = 2000;
            this.miningMessageType = 'regular';
        }
    }
    
    useLuckyCharm() {
        const { consumables, buffs } = this.gameState;
        
        if (consumables.luckyCharms > 0) {
            // Activate the buff
            buffs.luckyCharm.active = true;
            buffs.luckyCharm.tilesRemaining = 50;
            
            // Consume the charm
            consumables.luckyCharms -= 1;
            
            // Show message
            this.miningMessage = "🍀 Lucky Charm activated! 1.5x ore drops for 50 tiles!";
            this.miningMessageTime = 3000;
            this.miningMessageType = 'ore';
            
            // Save state
            this.gameState.save();
        } else {
            this.miningMessage = "No Lucky Charms! Buy them at the store.";
            this.miningMessageTime = 2000;
            this.miningMessageType = 'regular';
        }
    }
    
    useExplosiveCharge() {
        const { consumables, player } = this.gameState;
        
        if (!player.isUnderground) {
            this.miningMessage = "Can only use explosives underground!";
            this.miningMessageTime = 2000;
            this.miningMessageType = 'regular';
            return;
        }
        
        if (consumables.explosiveCharges > 0) {
            // Get player's current tile position
            const playerTileX = Math.floor(player.x / TILE_SIZE);
            const playerTileY = Math.floor(player.y / TILE_SIZE);
            
            // Clear 3x3 area around player
            let tilesCleared = 0;
            let oresCollected = {};
            let tilesToCheck = []; // Store tiles to check for gravity after explosion
            
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tileX = playerTileX + dx;
                    const tileY = playerTileY + dy;
                    const tile = this.world.getTile(tileX, tileY);
                    
                    if (tile) {
                        const tileProps = TILE_PROPERTIES[tile.type];
                        
                        // Don't destroy indestructible tiles
                        if (!tileProps.isIndestructible) {
                            // Collect ore if it's an ore tile
                            if (tileProps.isOre) {
                                const quantity = this.rollOreQuantity();
                                const oreType = Object.keys(TILE_TYPES).find(key => TILE_TYPES[key] === tile.type).toLowerCase();
                                
                                if (!oresCollected[oreType]) {
                                    oresCollected[oreType] = 0;
                                }
                                oresCollected[oreType] += quantity;
                                
                                // Add to inventory
                                if (this.gameState.inventory[oreType] !== undefined) {
                                    this.gameState.inventory[oreType] += quantity;
                                }
                            }
                            
                            // Remove the tile (without gravity check yet)
                            this.world.tiles.delete(`${tileX},${tileY}`);
                            this.world.revealTile(tileX, tileY);
                            tilesCleared++;
                            
                            // Mark tiles above for gravity check
                            tilesToCheck.push({x: tileX, y: tileY - 1});
                        }
                    }
                }
            }
            
            // Now check gravity for all affected tiles
            for (const pos of tilesToCheck) {
                this.world.checkGravity(pos.x, pos.y);
            }
            
            // Consume the charge
            consumables.explosiveCharges -= 1;
            
            // Create explosion effect message
            let message = `💥 BOOM! Cleared ${tilesCleared} tiles!`;
            if (Object.keys(oresCollected).length > 0) {
                message += ' Found: ';
                const oreMessages = [];
                for (const [ore, quantity] of Object.entries(oresCollected)) {
                    oreMessages.push(`${quantity} ${ore}`);
                }
                message += oreMessages.join(', ');
            }
            
            // Show message
            this.miningMessage = message;
            this.miningMessageTime = 4000;
            this.miningMessageType = 'ore';
            
            // Trigger screen shake for explosion
            if (this.gameState.renderer) {
                this.gameState.renderer.triggerScreenShake('medium');
            }
            
            // Save state
            this.gameState.save();
        } else {
            this.miningMessage = "No Explosive Charges! Buy them at the store.";
            this.miningMessageTime = 2000;
            this.miningMessageType = 'regular';
        }
    }
    
    teleportToSurface() {
        // Check if player has the upgrade and is underground
        if (!this.gameState.upgrades.instaLadder) {
            return false;
        }
        
        if (!this.gameState.player.isUnderground) {
            this.miningMessage = "Already on surface!";
            this.miningMessageTime = 1500;
            this.miningMessageType = 'regular';
            return false;
        }
        
        // Check if player is in elevator shaft
        if (!this.isAtElevator()) {
            this.miningMessage = "Must be in elevator shaft to teleport!";
            this.miningMessageTime = 2000;
            this.miningMessageType = 'regular';
            return false;
        }
        
        // Teleport to elevator entrance
        const elevatorX = BUILDINGS.elevator.x + BUILDING_WIDTH / 2;
        this.gameState.player.x = elevatorX;
        this.gameState.player.y = SURFACE_Y;
        this.gameState.player.vx = 0;
        this.gameState.player.vy = 0;
        
        // Reset falling state
        this.isFalling = false;
        this.fallVelocityX = 0;
        this.fallDistance = 0;
        
        // Return to surface
        this.gameState.returnToSurface();
        
        // Play sound effect if available
        if (this.gameState.audioManager) {
            this.gameState.audioManager.playSound('mine_dirt_1'); // Use existing sound
        }
        
        // Show message
        this.miningMessage = "⚡ Teleported to surface! ⚡";
        this.miningMessageTime = 2000;
        this.miningMessageType = 'ore'; // Use ore type for bigger display
        
        // Trigger effect
        this.teleportEffect = true;
        this.teleportEffectTime = 500;
        
        return true;
    }
}