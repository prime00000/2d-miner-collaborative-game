import { Enemy } from './Enemy.js';
import { TILE_SIZE, TILE_TYPES } from '../core/Constants.js';

export class RockWorm extends Enemy {
    constructor(x, y, world, gameState) {
        super(x, y, world, gameState);
        this.width = TILE_SIZE * 0.8;
        this.height = TILE_SIZE * 0.8;
        this.segments = 3; // Number of body segments
        this.segmentPositions = [];
        this.speed = 50; // pixels per second
        this.detectionRange = TILE_SIZE * 4; // 4 tiles
        this.burrowing = true;
        this.emergeTime = 0;
        this.emergeDelay = 2; // seconds to stay emerged
        this.moveTimer = 0;
        this.moveDelay = 0.5; // Move every 0.5 seconds
        
        // Initialize segment positions
        for (let i = 0; i < this.segments; i++) {
            this.segmentPositions.push({ x: x, y: y });
        }
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.moveTimer += deltaTime;
        const distance = this.getDistanceToPlayer();
        
        // Check if we should emerge
        if (this.burrowing && distance < this.detectionRange) {
            this.burrowing = false;
            this.emergeTime = this.emergeDelay;
        }
        
        if (!this.burrowing) {
            this.emergeTime -= deltaTime;
            
            // While emerged, try to move towards player
            if (this.moveTimer >= this.moveDelay) {
                this.moveTimer = 0;
                
                const player = this.gameState.player;
                const dx = Math.sign(player.x - this.x) * TILE_SIZE;
                const dy = Math.sign(player.y - this.y) * TILE_SIZE;
                
                // Try to move in soft tiles
                const newX = this.x + dx;
                const newY = this.y + dy;
                
                if (this.canMoveToTile(newX, newY)) {
                    // Update segment positions
                    for (let i = this.segments - 1; i > 0; i--) {
                        this.segmentPositions[i].x = this.segmentPositions[i - 1].x;
                        this.segmentPositions[i].y = this.segmentPositions[i - 1].y;
                    }
                    this.segmentPositions[0].x = this.x;
                    this.segmentPositions[0].y = this.y;
                    
                    // Move head
                    this.x = newX;
                    this.y = newY;
                }
            }
            
            // Check collision while emerged
            if (this.checkPlayerCollision()) {
                this.damagePlayer(5, 10); // 5 health, 10 cash
                this.burrowing = true; // Burrow after attacking
            }
            
            // Return to burrowing if time is up
            if (this.emergeTime <= 0) {
                this.burrowing = true;
            }
        } else {
            // While burrowing, move randomly through soft tiles
            if (this.moveTimer >= this.moveDelay * 2) {
                this.moveTimer = 0;
                
                // Random movement
                const directions = [
                    { dx: TILE_SIZE, dy: 0 },
                    { dx: -TILE_SIZE, dy: 0 },
                    { dx: 0, dy: TILE_SIZE },
                    { dx: 0, dy: -TILE_SIZE }
                ];
                
                const dir = directions[Math.floor(Math.random() * directions.length)];
                const newX = this.x + dir.dx;
                const newY = this.y + dir.dy;
                
                if (this.canMoveToTile(newX, newY)) {
                    // Update segment positions
                    for (let i = this.segments - 1; i > 0; i--) {
                        this.segmentPositions[i].x = this.segmentPositions[i - 1].x;
                        this.segmentPositions[i].y = this.segmentPositions[i - 1].y;
                    }
                    this.segmentPositions[0].x = this.x;
                    this.segmentPositions[0].y = this.y;
                    
                    this.x = newX;
                    this.y = newY;
                }
            }
        }
    }
    
    canMoveToTile(x, y) {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        const tile = this.world.getTile(tileX, tileY);
        
        // Can only move through dirt and clay
        if (!tile) return false;
        return tile.type === TILE_TYPES.DIRT || tile.type === TILE_TYPES.CLAY;
    }
    
    render(ctx, camera) {
        if (!this.active) return;
        
        ctx.save();
        
        // Draw segments (only if emerged)
        if (!this.burrowing) {
            // Draw body segments
            for (let i = this.segments - 1; i >= 0; i--) {
                const segment = this.segmentPositions[i];
                
                // Darker segments towards the tail
                const brightness = 1 - (i / this.segments) * 0.5;
                const color = Math.floor(139 * brightness); // Base color 139, 69, 19 (saddle brown)
                ctx.fillStyle = `rgb(${color}, ${Math.floor(69 * brightness)}, ${Math.floor(19 * brightness)})`;
                
                // Make segments slightly smaller towards tail
                const size = this.width * (1 - i * 0.1);
                ctx.fillRect(
                    segment.x + (this.width - size) / 2,
                    segment.y + (this.height - size) / 2,
                    size,
                    size
                );
            }
            
            // Draw head
            ctx.fillStyle = '#8B4513'; // Saddle brown
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw eyes/mouth
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x + 2, this.y + 2, 4, 4);
            ctx.fillRect(this.x + this.width - 6, this.y + 2, 4, 4);
            
            // Mouth
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x + this.width/2 - 4, this.y + this.height - 4, 8, 2);
        } else {
            // Don't draw anything when burrowing - worm is hidden underground
        }
        
        ctx.restore();
    }
    
    getDamageMessage(healthDamage, cashDamage) {
        return `Worm attack! -${healthDamage} HP, -$${cashDamage}`;
    }
}