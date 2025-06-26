import { 
    PLAYER_SPEED, 
    SURFACE_Y, 
    PLAYER_SIZE, 
    TILE_SIZE,
    BUILDINGS,
    BUILDING_WIDTH,
    ELEVATOR_PROXIMITY,
    MAX_DEPTH,
    TILE_PROPERTIES
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
        
        // Grid alignment
        this.targetGridX = null;
        this.isAligning = false;
        this.alignmentSpeed = 300; // pixels per second for alignment
    }
    
    update(deltaTime, input) {
        const player = this.gameState.player;
        const elevator = this.gameState.elevator;
        const moveAmount = PLAYER_SPEED * deltaTime;
        
        // Reset velocity
        player.vx = 0;
        player.vy = 0;
        
        // Check input
        const left = input.keys['arrowleft'] || input.keys['a'] || input.touches.left;
        const right = input.keys['arrowright'] || input.keys['d'] || input.touches.right;
        const up = input.keys['arrowup'] || input.keys['w'] || input.touches.up;
        const down = input.keys['arrowdown'] || input.keys['s'] || input.touches.down;
        const interact = input.keys[' '] || input.keys['e'];
        
        // Horizontal movement
        if (left) player.vx = -PLAYER_SPEED;
        if (right) player.vx = PLAYER_SPEED;
        
        // Check if player is at elevator
        const elevatorBuilding = BUILDINGS.elevator;
        const atElevator = Math.abs(player.x - (elevatorBuilding.x + BUILDING_WIDTH/2)) < ELEVATOR_PROXIMITY;
        
        if (!player.isUnderground) {
            // Surface movement
            player.y = SURFACE_Y - PLAYER_SIZE;
            
            // Vertical movement at elevator
            if (atElevator) {
                if (down && elevator.maxDepth > 0) {
                    this.gameState.enterUnderground();
                }
            }
        } else {
            // Underground movement
            if (atElevator) {
                // Elevator shaft movement
                if (up && player.depth > 0) {
                    player.vy = -PLAYER_SPEED;
                    player.depth = Math.max(0, player.depth - moveAmount / TILE_SIZE);
                    if (player.depth <= 0) {
                        this.gameState.returnToSurface();
                    }
                }
                if (down && player.depth < elevator.maxDepth) {
                    player.vy = PLAYER_SPEED;
                    player.depth = Math.min(elevator.maxDepth, player.depth + moveAmount / TILE_SIZE);
                }
            } else {
                // Regular underground movement with auto-mining
                
                // Track if player was on ground
                const wasOnGround = this.isOnGround();
                
                // Check if actively mining downward
                const isMiningDown = down && wasOnGround;
                
                // Only apply gravity if not actively mining downward
                if (!isMiningDown) {
                    // Apply gravity with smooth acceleration
                    const gravityAccel = 13500; // pixels per second squared (9x original speed)
                    player.vy += gravityAccel * deltaTime;
                    player.vy = Math.min(player.vy, 10800); // Terminal velocity (9x original)
                }
                
                // Grid alignment for underground movement
                const currentGridX = Math.round(player.x / TILE_SIZE) * TILE_SIZE;
                const currentGridY = Math.round(player.y / TILE_SIZE) * TILE_SIZE;
                const playerGridOffsetX = Math.abs(player.x - currentGridX);
                const playerGridOffsetY = Math.abs(player.y - currentGridY);
                
                // Ensure player Y is aligned to grid when on ground
                if (wasOnGround && playerGridOffsetY > 2) {
                    // Snap to nearest grid Y position
                    player.y = currentGridY;
                }
                
                // If player is on ground and trying to move down, force grid alignment first
                if (down && wasOnGround && playerGridOffsetX > 2) {
                    // Align to nearest grid column
                    this.isAligning = true;
                    this.targetGridX = currentGridX;
                } else if (down && wasOnGround) {
                    // Player is aligned, allow controlled downward mining
                    player.vy = PLAYER_SPEED; // Set to mining speed, not falling speed
                    this.isAligning = false;
                }
                
                // Handle grid alignment
                if (this.isAligning && this.targetGridX !== null) {
                    const alignDiff = this.targetGridX - player.x;
                    if (Math.abs(alignDiff) > 1) {
                        // Move towards aligned position
                        player.vx = Math.sign(alignDiff) * this.alignmentSpeed;
                        // Allow movement in this frame
                        player.x += player.vx * deltaTime;
                    } else {
                        // Close enough, snap to grid
                        player.x = this.targetGridX;
                        player.vx = 0;
                        this.isAligning = false;
                        this.targetGridX = null;
                        if (down) {
                            player.vy = PLAYER_SPEED;
                        }
                    }
                } else if (!this.isAligning) {
                    // Normal horizontal movement when not aligning
                    if (player.vx !== 0 && !down) {
                        const newX = player.x + player.vx * deltaTime;
                        
                        // Check if we can move horizontally
                        const canMove = this.checkAndMine(newX, player.y, player.x, player.y, true);
                        
                        if (canMove) {
                            player.x = newX;
                            
                            // Trigger detection for adjacent tiles
                            const gridX = Math.floor(player.x / TILE_SIZE);
                            const gridY = Math.floor(player.y / TILE_SIZE);
                            this.world.detectAdjacentTiles(gridX, gridY);
                            
                            // After moving horizontally, check if we should start falling
                            if (!this.isOnGround() && !this.isFalling && !isMiningDown) {
                                this.isFalling = true;
                                this.fallStartY = player.y;
                            }
                        } else {
                            // Hit a wall - check if we need to adjust Y position to fit through
                            const tileY = Math.floor(player.y / TILE_SIZE);
                            const alignedY = tileY * TILE_SIZE;
                            
                            // Try moving at aligned Y position
                            if (Math.abs(player.y - alignedY) < TILE_SIZE * 0.3) {
                                // Close enough to snap to aligned position
                                if (this.checkAndMine(newX, alignedY, player.x, alignedY, true)) {
                                    player.x = newX;
                                    player.y = alignedY;
                                    
                                    // Check for falling after adjustment
                                    if (!this.isOnGround() && !this.isFalling && !isMiningDown) {
                                        this.isFalling = true;
                                        this.fallStartY = player.y;
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
                            }
                        }
                    } else {
                        // Hit ground
                        if (this.isFalling && player.vy > 0) {
                            this.handleFallImpact();
                        }
                        player.vy = 0;
                        this.isFalling = false;
                        this.lastGroundY = player.y;
                    }
                }
            }
        }
        
        // Apply movement for surface and elevator
        if (!player.isUnderground || atElevator) {
            player.x += player.vx * deltaTime;
            if (player.isUnderground && atElevator) {
                player.y = SURFACE_Y + (player.depth * TILE_SIZE);
            }
        }
        
        // Update depth based on Y position
        if (player.isUnderground && !atElevator) {
            const surfaceRow = Math.floor(SURFACE_Y / TILE_SIZE);
            const currentRow = Math.floor(player.y / TILE_SIZE);
            player.depth = currentRow - surfaceRow;
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
        
        // Get player bounds - player is centered on X, bottom-aligned on Y
        const playerWidth = PLAYER_SIZE * 0.8; // Slightly smaller width for easier movement
        const playerLeft = newX - playerWidth/2;
        const playerRight = newX + playerWidth/2;
        const playerTop = newY - PLAYER_SIZE + 1; // Small offset to prevent ceiling collision
        const playerBottom = newY - 1; // Small offset to ensure proper ground contact
        
        // Check tiles that player would overlap
        const startTileX = Math.floor(playerLeft / TILE_SIZE);
        const endTileX = Math.floor(playerRight / TILE_SIZE);
        const startTileY = Math.floor(playerTop / TILE_SIZE);
        const endTileY = Math.floor(playerBottom / TILE_SIZE);
        
        for (let ty = startTileY; ty <= endTileY; ty++) {
            for (let tx = startTileX; tx <= endTileX; tx++) {
                const tile = this.world.getTile(tx, ty);
                if (tile) {
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
                    
                    // Check fuel
                    if (this.gameState.resources.fuel < tile.fuelCost) {
                        this.miningMessage = 'Not enough fuel!';
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
        // Consume fuel
        this.gameState.resources.fuel -= tile.fuelCost;
        
        // Add cash if tile has value
        if (tile.value) {
            this.gameState.resources.cash += tile.value;
        }
        
        // Remove the tile
        this.world.removeTile(x, y);
        
        // Show mining feedback
        const tileProps = TILE_PROPERTIES[tile.type];
        const tileName = tileProps.name;
        
        if (tileProps.isOre) {
            // Big message for valuable ores
            this.miningMessage = `💎 ${tileName.toUpperCase()} FOUND! +$${tile.value} 💎`;
            this.miningMessageTime = 3000; // Show longer
            this.miningMessageType = 'ore';
            this.miningMessageColor = tileProps.color;
        } else {
            // Regular message for dirt/clay/stone
            this.miningMessage = `Mined ${tileName}`;
            this.miningMessageTime = 1000;
            this.miningMessageType = 'regular';
            this.miningMessageColor = null;
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
        
        if (blocksFallen <= 1) {
            // Safe fall - no damage
            return;
        } else if (blocksFallen === 2) {
            damage = Math.floor(this.gameState.resources.maxHealth * 0.2); // 20% damage
            message = `Ouch! Fell ${blocksFallen} blocks (-${damage} HP)`;
            this.impactEffect = 'light';
        } else if (blocksFallen === 3) {
            damage = Math.floor(this.gameState.resources.maxHealth * 0.5); // 50% damage
            message = `Ow! Fell ${blocksFallen} blocks (-${damage} HP)`;
            this.impactEffect = 'medium';
        } else {
            damage = this.gameState.resources.maxHealth; // 100% damage (death)
            message = `Fatal fall! Fell ${blocksFallen} blocks`;
            this.impactEffect = 'heavy';
        }
        
        // Apply damage
        if (damage > 0) {
            this.gameState.resources.health = Math.max(0, this.gameState.resources.health - damage);
            this.miningMessage = message;
            this.miningMessageTime = 3000;
            this.impactEffectTime = 500; // Half second impact effect
        }
        
        // Reset fall tracking
        this.fallDistance = 0;
    }
    
    getImpactEffect() {
        return this.impactEffect;
    }
}