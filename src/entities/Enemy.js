import { TILE_SIZE } from '../core/Constants.js';

export class Enemy {
    constructor(x, y, world, gameState) {
        this.x = x;
        this.y = y;
        this.world = world;
        this.gameState = gameState;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.vx = 0;
        this.vy = 0;
        this.health = 100;
        this.active = true;
        this.lastDamageTime = 0;
        this.damageImmunityTime = 1000; // 1 second immunity after dealing damage
    }
    
    update(deltaTime) {
        // Override in subclasses
    }
    
    render(ctx, camera) {
        // Override in subclasses
    }
    
    // Check collision with player
    checkPlayerCollision() {
        if (!this.active || !this.gameState.player) return false;
        
        const player = this.gameState.player;
        const playerWidth = TILE_SIZE * 0.8;
        const playerHeight = TILE_SIZE;
        
        // Simple AABB collision
        return this.x < player.x + playerWidth/2 &&
               this.x + this.width > player.x - playerWidth/2 &&
               this.y < player.y &&
               this.y + this.height > player.y - playerHeight;
    }
    
    // Deal damage to player
    damagePlayer(healthDamage, cashDamage = 0) {
        const now = Date.now();
        if (now - this.lastDamageTime < this.damageImmunityTime) return;
        
        this.gameState.resources.health = Math.max(0, this.gameState.resources.health - healthDamage);
        this.lastDamageTime = now;
        
        if (cashDamage > 0) {
            this.gameState.resources.cash = Math.max(0, this.gameState.resources.cash - cashDamage);
        }
        
        // Show damage message
        if (this.gameState.playerRef) {
            const player = this.gameState.playerRef;
            player.miningMessage = this.getDamageMessage(healthDamage, cashDamage);
            player.miningMessageTime = 2000;
            player.miningMessageType = 'regular';
            
            // Trigger screen shake
            if (this.gameState.renderer) {
                this.gameState.renderer.triggerScreenShake('light');
            }
            
            // Check for death
            if (this.gameState.resources.health <= 0) {
                player.handleDeath();
            }
        }
    }
    
    getDamageMessage(healthDamage, cashDamage) {
        // Override in subclasses
        return `-${healthDamage} HP`;
    }
    
    // Get distance to player
    getDistanceToPlayer() {
        if (!this.gameState.player) return Infinity;
        const player = this.gameState.player;
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}