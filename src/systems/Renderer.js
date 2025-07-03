import { 
    TILE_SIZE,
    SURFACE_Y,
    BUILDING_HEIGHT,
    BUILDING_WIDTH,
    PLAYER_SIZE,
    ELEVATOR_SHAFT_WIDTH,
    BUILDINGS,
    COLORS,
    UI,
    TILE_PROPERTIES,
    TILE_TYPES
} from '../core/Constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Screen shake effect
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
    }
    
    clear() {
        this.ctx.fillStyle = COLORS.sky;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    render(gameState, world, player) {
        const { camera, elevator } = gameState;
        
        // Handle impact effects - only trigger if effect just started
        if (player && player.getImpactEffect() && player.impactEffectTime > 450) {
            this.triggerScreenShake(player.getImpactEffect());
        }
        
        // Update screen shake
        this.updateScreenShake(16); // ~60fps default
        
        this.clear();
        
        // Save context
        this.ctx.save();
        
        // Apply camera transform with shake offset
        this.ctx.translate(-camera.x + this.shakeOffset.x, -camera.y + this.shakeOffset.y);
        
        // Draw surface
        this.drawSurface(camera);
        
        // Draw underground if visible
        if (camera.y > 0 || gameState.player.isUnderground) {
            this.drawUnderground(camera, elevator);
        }
        
        // Draw tiles
        if (world) {
            this.drawTiles(world, camera);
        }
        
        // Draw elevator shaft
        if (elevator.maxDepth > 0) {
            this.drawElevatorShaft(elevator);
        }
        
        // Draw buildings
        this.drawBuildings();
        
        // Draw player with falling indicator
        this.drawPlayer(gameState.player, player);
        
        // Restore context
        this.ctx.restore();
        
        // Draw impact flash effect
        if (player && player.impactEffectTime > 0) {
            this.drawImpactFlash(player.getImpactEffect(), player.impactEffectTime);
        }
        
        // Draw UI hints (not affected by camera)
        this.drawUIHints(gameState);
        
        // Draw mining message
        if (player && player.getMiningMessage()) {
            this.drawMiningMessage(player.getMiningMessage(), player);
        }
    }
    
    drawSurface(camera) {
        this.ctx.fillStyle = COLORS.surface;
        this.ctx.fillRect(0, SURFACE_Y, this.canvas.width + camera.x, this.canvas.height);
    }
    
    drawUnderground(camera, elevator) {
        // Underground background
        this.ctx.fillStyle = COLORS.underground;
        this.ctx.fillRect(0, SURFACE_Y, this.canvas.width + camera.x, this.canvas.height + camera.y);
        
        // Draw depth markers
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        this.ctx.font = UI.font.small;
        this.ctx.fillStyle = COLORS.depthMarker;
        
        for (let d = UI.depthMarkerInterval; d <= elevator.maxDepth; d += UI.depthMarkerInterval) {
            const y = SURFACE_Y + (d * TILE_SIZE);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width + camera.x, y);
            this.ctx.stroke();
            this.ctx.fillText(`-${d}m`, 10, y - 5);
        }
    }
    
    drawElevatorShaft(elevator) {
        // Center the shaft in the building - building is already aligned so shaft will be too
        const elevatorX = BUILDINGS.elevator.x + (BUILDING_WIDTH - ELEVATOR_SHAFT_WIDTH) / 2;
        
        // Shaft background
        this.ctx.fillStyle = COLORS.elevatorShaft;
        this.ctx.fillRect(elevatorX, SURFACE_Y, ELEVATOR_SHAFT_WIDTH, elevator.maxDepth * TILE_SIZE);
        
        // Draw ladder
        this.ctx.strokeStyle = COLORS.ladder;
        this.ctx.lineWidth = 2;
        const ladderX = elevatorX + ELEVATOR_SHAFT_WIDTH / 2;
        
        // Ladder sides
        this.ctx.beginPath();
        this.ctx.moveTo(ladderX - 10, SURFACE_Y);
        this.ctx.lineTo(ladderX - 10, SURFACE_Y + elevator.maxDepth * TILE_SIZE);
        this.ctx.moveTo(ladderX + 10, SURFACE_Y);
        this.ctx.lineTo(ladderX + 10, SURFACE_Y + elevator.maxDepth * TILE_SIZE);
        this.ctx.stroke();
        
        // Ladder rungs
        for (let i = 0; i < elevator.maxDepth * TILE_SIZE; i += UI.ladderRungSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(ladderX - 10, SURFACE_Y + i);
            this.ctx.lineTo(ladderX + 10, SURFACE_Y + i);
            this.ctx.stroke();
        }
    }
    
    drawBuildings() {
        for (const [key, building] of Object.entries(BUILDINGS)) {
            // Building body
            this.ctx.fillStyle = building.color;
            this.ctx.fillRect(building.x, SURFACE_Y - BUILDING_HEIGHT, BUILDING_WIDTH, BUILDING_HEIGHT);
            
            // Building label
            this.ctx.fillStyle = COLORS.uiText;
            this.ctx.font = UI.font.mediumBold;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(building.label, building.x + BUILDING_WIDTH/2, SURFACE_Y - BUILDING_HEIGHT/2);
        }
    }
    
    drawPlayer(playerState, playerObj) {
        // Calculate player draw position
        const playerWidth = PLAYER_SIZE * 0.8;
        const playerHeight = PLAYER_SIZE - 2; // Slightly shorter to fit in tunnels better
        const drawX = playerState.x - playerWidth/2;
        const drawY = playerState.y - playerHeight;
        
        // Draw falling indicator (but not when pressing down to mine)
        const isPressingDown = playerObj && playerObj.gameState.input.keys['arrowdown'] || 
                              playerObj.gameState.input.keys['s'] || 
                              playerObj.gameState.input.touches.down;
        
        if (playerObj && playerObj.isFalling && !isPressingDown) {
            // Draw motion blur effect
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            for (let i = 1; i <= 3; i++) {
                this.ctx.fillStyle = COLORS.player;
                this.ctx.fillRect(
                    drawX, 
                    drawY - (i * 8), 
                    playerWidth, 
                    playerHeight
                );
            }
            this.ctx.restore();
        }
        
        // Draw player
        this.ctx.fillStyle = COLORS.player;
        this.ctx.fillRect(drawX, drawY, playerWidth, playerHeight);
        
        // Draw a small helmet/head detail
        this.ctx.fillStyle = '#FFD700'; // Gold helmet
        this.ctx.fillRect(drawX + 2, drawY + 2, playerWidth - 4, 6);
        
        // Direction indicator
        this.ctx.fillStyle = COLORS.playerIndicator;
        this.ctx.fillRect(playerState.x - 2, drawY - 5, 4, 4);
    }
    
    drawUIHints(gameState) {
        const { player } = gameState;
        
        if (!player.isUnderground) {
            // Check which building the player is at
            for (const [key, building] of Object.entries(BUILDINGS)) {
                const buildingCenter = building.x + BUILDING_WIDTH / 2;
                const distance = Math.abs(player.x - buildingCenter);
                
                if (distance < BUILDING_WIDTH / 2) {
                    let hint = '';
                    if (key === 'elevator') {
                        hint = 'Press DOWN to enter mine';
                    } else if (key === 'medical') {
                        hint = 'Press SPACE to rest ($50 - restores health & resets discovery)';
                    } else if (key === 'store') {
                        hint = 'Press SPACE to shop';
                    } else if (key === 'assayer') {
                        hint = 'Press SPACE to sell ores';
                    }
                    
                    if (hint) {
                        this.ctx.fillStyle = COLORS.uiBackground;
                        this.ctx.fillRect(this.canvas.width/2 - 150, this.canvas.height - 100, 300, 30);
                        this.ctx.fillStyle = COLORS.uiText;
                        this.ctx.font = UI.font.large;
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(hint, this.canvas.width/2, this.canvas.height - 80);
                    }
                    break;
                }
            }
        }
    }
    
    drawTiles(world, camera) {
        // Calculate visible tile range
        const startX = Math.floor(camera.x / TILE_SIZE) - 1;
        const endX = Math.ceil((camera.x + this.canvas.width) / TILE_SIZE) + 1;
        const startY = Math.floor(camera.y / TILE_SIZE) - 1;
        const endY = Math.ceil((camera.y + this.canvas.height) / TILE_SIZE) + 1;
        
        // Draw all tiles in visible area
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                // Only draw underground tiles
                if (y * TILE_SIZE >= SURFACE_Y) {
                    const tile = world.getTile(x, y);
                    
                    if (tile) {
                        // Border tiles are always visible
                        const tileProps = TILE_PROPERTIES[tile.type];
                        if (tileProps.isIndestructible || world.isTileRevealed(x, y)) {
                            // Draw the actual tile
                            this.drawTile(x, y, tile);
                        } else {
                            // Draw as dirt (unknown)
                            this.drawUnknownTile(x, y);
                        }
                    }
                }
            }
        }
    }
    
    drawTile(tileX, tileY, tile) {
        const worldX = tileX * TILE_SIZE;
        const worldY = tileY * TILE_SIZE;
        const tileProps = TILE_PROPERTIES[tile.type];
        
        // Draw the actual tile
        this.ctx.fillStyle = tileProps.color;
        this.ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
        
        // Add speckled pattern for border tiles
        if (tileProps.isIndestructible) {
            this.addBorderSpeckles(worldX, worldY);
        }
        
        // Add sparkle effect for ores
        if (tileProps.isOre) {
            this.addOreSparkle(worldX, worldY, tileProps.color);
        }
        
        // Draw tile outline for better visibility
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
    }
    
    drawUnknownTile(tileX, tileY) {
        const worldX = tileX * TILE_SIZE;
        const worldY = tileY * TILE_SIZE;
        
        // Draw as dirt (unknown tiles appear as dirt)
        this.ctx.fillStyle = TILE_PROPERTIES[TILE_TYPES.DIRT].color;
        this.ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
        
        // Draw tile outline
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
    }
    
    addBorderSpeckles(x, y) {
        // Add random speckles to make border tiles distinctive
        this.ctx.save();
        this.ctx.fillStyle = '#333333'; // Slightly lighter speckles
        
        // Use tile position as seed for consistent speckles
        const seed = (x * 7 + y * 13) % 100;
        const speckleCount = 8 + (seed % 5);
        
        for (let i = 0; i < speckleCount; i++) {
            const speckleX = x + 2 + ((seed * i * 3) % (TILE_SIZE - 4));
            const speckleY = y + 2 + ((seed * i * 5) % (TILE_SIZE - 4));
            const size = 1 + (seed * i % 2);
            this.ctx.fillRect(speckleX, speckleY, size, size);
        }
        
        this.ctx.restore();
    }
    
    addOreSparkle(x, y, color) {
        const time = Date.now() / 1000;
        const sparkle = Math.sin(time * 3) * 0.5 + 0.5;
        
        this.ctx.save();
        this.ctx.globalAlpha = sparkle * 0.5;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(
            x + TILE_SIZE * 0.3,
            y + TILE_SIZE * 0.3,
            TILE_SIZE * 0.4,
            TILE_SIZE * 0.4
        );
        this.ctx.restore();
    }
    
    drawMiningMessage(message, player) {
        const messageType = player.getMiningMessageType() || 'regular';
        const messageColor = player.getMiningMessageColor();
        
        if (messageType === 'death') {
            // Death message - extra prominent
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            // Large dark background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.fillRect(centerX - 350, centerY - 60, 700, 120);
            
            // Red border
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 5;
            this.ctx.strokeRect(centerX - 350, centerY - 60, 700, 120);
            
            // Death message in red
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Split message into two lines
            const lines = message.split('. ');
            this.ctx.fillText(lines[0] + '.', centerX, centerY - 20);
            if (lines[1]) {
                this.ctx.fillText(lines[1], centerX, centerY + 20);
            }
        } else if (messageType === 'ore' || messageType === 'ore-multi') {
            // Big centered message for valuable ores
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2 - 100;
            
            // Bigger box for multi-ore finds
            const boxWidth = messageType === 'ore-multi' ? 600 : 500;
            const boxHeight = messageType === 'ore-multi' ? 100 : 80;
            
            // Background box with rounded corners effect
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(centerX - boxWidth/2, centerY - boxHeight/2, boxWidth, boxHeight);
            
            // Border in ore color
            this.ctx.strokeStyle = messageColor || '#FFD700';
            this.ctx.lineWidth = messageType === 'ore-multi' ? 5 : 3;
            this.ctx.strokeRect(centerX - boxWidth/2, centerY - boxHeight/2, boxWidth, boxHeight);
            
            // Big text with ore color
            this.ctx.fillStyle = messageColor || '#FFD700';
            this.ctx.font = messageType === 'ore-multi' ? 'bold 42px Arial' : 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(message, centerX, centerY);
            
            // Add sparkle effects around the message
            const time = Date.now() / 100;
            const sparkleCount = messageType === 'ore-multi' ? 16 : 8;
            this.ctx.save();
            for (let i = 0; i < sparkleCount; i++) {
                const angle = (i / sparkleCount) * Math.PI * 2 + time * 0.05;
                const radius = (boxWidth/2 + 30) + Math.sin(time * 0.1 + i) * 20;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                this.ctx.globalAlpha = 0.5 + Math.sin(time * 0.2 + i) * 0.5;
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(x - 3, y - 3, 6, 6);
            }
            this.ctx.restore();
        } else {
            // Regular small message for dirt/clay/stone
            this.ctx.fillStyle = COLORS.uiBackground;
            this.ctx.fillRect(this.canvas.width/2 - 150, 50, 300, 40);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'alphabetic';
            this.ctx.fillText(message, this.canvas.width/2, 75);
        }
    }
    
    triggerScreenShake(impactType) {
        if (this.shakeDuration > 0) return; // Already shaking
        
        switch (impactType) {
            case 'light':
                this.shakeIntensity = 5;
                this.shakeDuration = 200;
                break;
            case 'medium':
                this.shakeIntensity = 10;
                this.shakeDuration = 300;
                break;
            case 'heavy':
                this.shakeIntensity = 20;
                this.shakeDuration = 500;
                break;
        }
    }
    
    updateScreenShake(deltaTime = 16) {
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;
            
            if (this.shakeDuration > 0) {
                // Random shake offset
                this.shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
                this.shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
                
                // Decay intensity
                this.shakeIntensity *= 0.95;
            } else {
                // Reset shake
                this.shakeOffset.x = 0;
                this.shakeOffset.y = 0;
                this.shakeIntensity = 0;
                this.shakeDuration = 0;
            }
        }
    }
    
    drawImpactFlash(impactType, effectTime) {
        let alpha = 0;
        let color = '';
        
        switch (impactType) {
            case 'light':
                alpha = 0.2 * (effectTime / 500);
                color = 'rgba(255, 100, 100, ' + alpha + ')';
                break;
            case 'medium':
                alpha = 0.4 * (effectTime / 500);
                color = 'rgba(255, 50, 50, ' + alpha + ')';
                break;
            case 'heavy':
                alpha = 0.6 * (effectTime / 500);
                color = 'rgba(255, 0, 0, ' + alpha + ')';
                break;
        }
        
        if (alpha > 0) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}