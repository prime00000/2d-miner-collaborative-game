import { Enemy } from './Enemy.js';
import { TILE_SIZE, WORLD } from '../core/Constants.js';

export class CaveBat extends Enemy {
    constructor(x, y, world, gameState) {
        super(x, y, world, gameState);
        this.width = TILE_SIZE * 0.6;
        this.height = TILE_SIZE * 0.4;
        this.speed = 100; // pixels per second
        this.detectionRange = TILE_SIZE * 5; // 5 tiles
        this.swoopSpeed = 200;
        this.isSwooping = false;
        this.homeY = y; // Remember starting Y position
        this.hoverAmplitude = 10; // Pixels to move up/down while hovering
        this.hoverSpeed = 2; // Speed of hovering motion
        this.time = 0;
        this.targetX = x;
        this.targetY = y;
        // Start with random time offset for varied hovering
        this.time = Math.random() * Math.PI * 2;
        
        // Wandering behavior
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderSpeed = 80; // pixels per second (increased from 50)
        this.timeSinceDirectionChange = 0;
        this.directionChangeInterval = 1000 + Math.random() * 2000; // Change direction every 1-3 seconds
        
        // Damage tracking
        this.totalDamageDealt = 0; // Track total damage dealt to player
        this.maxDamage = 10; // Maximum damage this bat can deal
        this.damagePerBite = 2; // Damage per bite
        this.isAttached = false; // Whether bat is attached to player
        this.attachTime = 0; // How long bat has been attached
        this.biteInterval = 500; // Time between bites in ms (0.5 seconds)
        this.lastBiteTime = 0;
        
        // Death animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500; // 0.5 seconds fade out
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.time += deltaTime;
        
        // Handle death animation
        if (this.isDying) {
            this.deathTimer += deltaTime * 1000;
            if (this.deathTimer >= this.deathDuration) {
                this.active = false;
            }
            return; // Don't update movement while dying
        }
        
        // If attached to player, follow them and bite periodically
        if (this.isAttached) {
            const player = this.gameState.player;
            if (!player) {
                this.isAttached = false;
                return;
            }
            
            // Follow player position
            this.x = player.x - this.width/2;
            this.y = player.y - player.height + this.height;
            
            this.attachTime += deltaTime * 1000; // Convert to ms
            
            // Check if we should bite
            const now = Date.now();
            if (now - this.lastBiteTime >= this.biteInterval) {
                // Only bite if we haven't reached max damage
                if (this.totalDamageDealt < this.maxDamage) {
                    const damageToApply = Math.min(this.damagePerBite, this.maxDamage - this.totalDamageDealt);
                    this.damagePlayer(damageToApply);
                    this.totalDamageDealt += damageToApply;
                    this.lastBiteTime = now;
                    console.log(`Bat bite! ${damageToApply} damage (total: ${this.totalDamageDealt}/${this.maxDamage})`);
                    
                    // Start death animation after dealing max damage
                    if (this.totalDamageDealt >= this.maxDamage) {
                        this.isAttached = false;
                        this.isSwooping = false;
                        this.isDying = true;
                        console.log('Bat dying - max damage dealt');
                    }
                }
            }
            
            // Also detach if player moves too far from home position
            const distFromHome = Math.abs(player.y - this.homeY);
            if (distFromHome > TILE_SIZE * 10) {
                this.isAttached = false;
                this.isSwooping = false;
                console.log('Bat detaching - too far from home');
            }
            return;
        }
        
        const distance = this.getDistanceToPlayer();
        
        // Check if we should start swooping (only if we haven't dealt max damage)
        if (!this.isSwooping && distance < this.detectionRange && this.totalDamageDealt < this.maxDamage) {
            const player = this.gameState.player;
            // Check if player is below the bat
            if (player.y > this.y) {
                this.isSwooping = true;
                this.targetX = player.x;
                this.targetY = player.y - TILE_SIZE/2;
            }
        }
        
        if (this.isSwooping) {
            // Swoop towards target
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                // Move towards target
                this.vx = (dx / dist) * this.swoopSpeed;
                this.vy = (dy / dist) * this.swoopSpeed;
                
                this.x += this.vx * deltaTime;
                this.y += this.vy * deltaTime;
            } else {
                // Reached target, return to home position
                this.isSwooping = false;
            }
            
            // Check collision during swoop
            if (this.checkPlayerCollision() && !this.isAttached) {
                // Attach to player on first hit
                this.isAttached = true;
                this.attachTime = 0;
                this.lastBiteTime = 0;
                console.log(`Bat attached! Will deal up to ${this.maxDamage} damage total`);
            }
        } else {
            // Wander around when not swooping
            this.timeSinceDirectionChange += deltaTime * 1000;
            
            // Change direction periodically
            if (this.timeSinceDirectionChange > this.directionChangeInterval) {
                this.wanderAngle = Math.random() * Math.PI * 2;
                this.timeSinceDirectionChange = 0;
                this.directionChangeInterval = 1000 + Math.random() * 2000; // Match constructor timing
                console.log(`Bat changing direction to angle: ${this.wanderAngle.toFixed(2)}`);
            }
            
            // Move in current wander direction
            this.vx = Math.cos(this.wanderAngle) * this.wanderSpeed;
            this.vy = Math.sin(this.wanderAngle) * this.wanderSpeed;
            
            // Add hover motion on top of wandering
            const hoverOffset = Math.sin(this.time * this.hoverSpeed) * this.hoverAmplitude;
            
            this.x += this.vx * deltaTime;
            this.y += (this.vy * deltaTime) + (hoverOffset * deltaTime);
            
            // Keep somewhat near home area (within 10 tiles)
            const distFromHome = Math.sqrt(
                Math.pow(this.x - this.targetX, 2) + 
                Math.pow(this.y - this.homeY, 2)
            );
            
            if (distFromHome > TILE_SIZE * 10) {
                // Turn back towards home
                this.wanderAngle = Math.atan2(
                    this.homeY - this.y,
                    this.targetX - this.x
                );
            }
        }
        
        // Check world boundaries (but allow flying through tiles)
        this.x = Math.max(0, Math.min(this.x, WORLD.width * TILE_SIZE - this.width));
        this.y = Math.max(0, Math.min(this.y, WORLD.depth * TILE_SIZE - this.height));
        
        // Bats can fly through solid tiles - no collision detection needed
    }
    
    render(ctx, camera) {
        if (!this.active) return;
        
        // Check if bat is inside a tile
        const tileX = Math.floor((this.x + this.width/2) / TILE_SIZE);
        const tileY = Math.floor((this.y + this.height/2) / TILE_SIZE);
        const isInsideTile = this.world.getTile(tileX, tileY) !== null;
        
        // Draw bat
        ctx.save();
        
        // Apply death fade effect
        if (this.isDying) {
            const fadeProgress = 1 - (this.deathTimer / this.deathDuration);
            ctx.globalAlpha = fadeProgress;
        }
        
        // If inside a tile, draw with higher opacity and glow effect
        if (isInsideTile && !this.isDying) {
            // Draw a glowing outline
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FF00FF';
            ctx.globalAlpha = 0.9;
        }
        
        ctx.fillStyle = '#4A0080'; // Dark purple
        
        // Body (camera transform is already applied, so use world coordinates directly)
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Wings (simple rectangles that move)
        const wingFlap = Math.sin(this.time * 10) * 5;
        ctx.fillStyle = '#6A00B0';
        
        // Left wing
        ctx.fillRect(this.x - 8, this.y + wingFlap, 8, this.height * 0.6);
        // Right wing
        ctx.fillRect(this.x + this.width, this.y - wingFlap, 8, this.height * 0.6);
        
        // Eyes (red when swooping/attached, yellow otherwise)
        ctx.fillStyle = (this.isSwooping || this.isAttached) ? '#FF0000' : '#FFFF00';
        ctx.fillRect(this.x + 2, this.y + 2, 2, 2);
        ctx.fillRect(this.x + this.width - 4, this.y + 2, 2, 2);
        
        // Show damage indicator when attached
        if (this.isAttached) {
            ctx.fillStyle = '#FF0000';
            ctx.font = '10px Arial';
            ctx.fillText(`${this.totalDamageDealt}/${this.maxDamage}`, this.x, this.y - 5);
        }
        
        // Reset shadow effects
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }
    
    getDamageMessage(healthDamage, cashDamage) {
        return `Bat bite! -${healthDamage} HP (${this.totalDamageDealt}/${this.maxDamage} total)`;
    }
}