import { 
    TILE_SIZE,
    SURFACE_Y,
    BUILDING_HEIGHT,
    BUILDING_WIDTH,
    PLAYER_SIZE,
    ELEVATOR_SHAFT_WIDTH,
    ELEVATOR_PROXIMITY,
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
            this.drawTiles(world, camera, gameState);
        }
        
        // Draw elevator shaft
        if (elevator.maxDepth > 0) {
            this.drawElevatorShaft(elevator);
        }
        
        // Draw buildings
        this.drawBuildings();
        
        // Draw player with falling indicator
        this.drawPlayer(gameState.player, player);
        
        // Draw teleport effect if active
        if (player && player.teleportEffect && player.teleportEffectTime > 0) {
            this.drawTeleportEffect(gameState.player, player.teleportEffectTime);
        }
        
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
        
        // Draw achievement notification
        if (gameState.achievementManager) {
            this.drawAchievementNotification(gameState.achievementManager.getCurrentNotification());
        }
        
        // Draw regeneration message
        if (world && world.regenerationMessage && world.regenerationMessageTime > 0) {
            this.drawRegenerationMessage(world.regenerationMessage, world.regenerationMessageTime);
        }
        
        // Draw market notifications
        if (gameState.marketManager) {
            this.drawMarketNotifications(gameState.marketManager);
        }
        
        // Draw market ticker
        if (gameState.marketManager) {
            this.drawMarketTicker(gameState.marketManager);
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
        } else {
            // Show teleport hint when underground with Insta-Ladder and in elevator shaft
            if (gameState.upgrades && gameState.upgrades.instaLadder) {
                // Check if player is at elevator
                const elevatorBuilding = BUILDINGS.elevator;
                const atElevator = Math.abs(player.x - (elevatorBuilding.x + BUILDING_WIDTH/2)) < ELEVATOR_PROXIMITY;
                
                if (atElevator) {
                    this.ctx.fillStyle = COLORS.uiBackground;
                    this.ctx.fillRect(this.canvas.width/2 - 150, this.canvas.height - 60, 300, 30);
                    this.ctx.fillStyle = '#00FFFF';
                    this.ctx.font = UI.font.large;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('Press T to teleport to surface', this.canvas.width/2, this.canvas.height - 40);
                }
            }
        }
    }
    
    drawTiles(world, camera, gameState) {
        // Calculate visible tile range
        const startX = Math.floor(camera.x / TILE_SIZE) - 1;
        const endX = Math.ceil((camera.x + this.canvas.width) / TILE_SIZE) + 1;
        const startY = Math.floor(camera.y / TILE_SIZE) - 1;
        const endY = Math.ceil((camera.y + this.canvas.height) / TILE_SIZE) + 1;
        
        // Get player tile position for deep scanner
        const hasDeepScanner = gameState && gameState.upgrades && gameState.upgrades.deepScanner;
        let playerTileX, playerTileY;
        if (hasDeepScanner && gameState.player) {
            playerTileX = Math.floor(gameState.player.x / TILE_SIZE);
            playerTileY = Math.floor((gameState.player.y - PLAYER_SIZE / 2) / TILE_SIZE);
        }
        
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
                            // Check if deep scanner reveals this tile
                            const isInScannerRange = hasDeepScanner && 
                                Math.abs(x - playerTileX) <= 3 && 
                                Math.abs(y - playerTileY) <= 3;
                            
                            if (isInScannerRange && tileProps.isOre) {
                                // Draw as dirt but with ore indicator
                                this.drawUnknownTileWithOreHint(x, y, tile);
                            } else {
                                // Draw as dirt (unknown)
                                this.drawUnknownTile(x, y);
                            }
                        }
                    }
                }
            }
        }
        
        // Draw enemies
        if (world.enemies) {
            const visibleEnemies = world.getEnemiesInArea(
                camera.x - TILE_SIZE,
                camera.y - TILE_SIZE,
                camera.x + this.canvas.width + TILE_SIZE,
                camera.y + this.canvas.height + TILE_SIZE
            );
            
            for (const enemy of visibleEnemies) {
                enemy.render(this.ctx, camera);
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
    
    drawUnknownTileWithOreHint(tileX, tileY, tile) {
        const worldX = tileX * TILE_SIZE;
        const worldY = tileY * TILE_SIZE;
        const tileProps = TILE_PROPERTIES[tile.type];
        
        // Draw as dirt base
        this.ctx.fillStyle = TILE_PROPERTIES[TILE_TYPES.DIRT].color;
        this.ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
        
        // Add subtle ore color hint in center
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = tileProps.color;
        
        // Draw small indicator in center
        const indicatorSize = TILE_SIZE * 0.4;
        const offset = (TILE_SIZE - indicatorSize) / 2;
        this.ctx.fillRect(
            worldX + offset, 
            worldY + offset, 
            indicatorSize, 
            indicatorSize
        );
        
        // Add scanner pulse effect
        const time = Date.now() / 1000;
        const pulse = (Math.sin(time * 3) + 1) / 2;
        this.ctx.globalAlpha = 0.3 + pulse * 0.3;
        this.ctx.strokeStyle = tileProps.color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            worldX + offset - 2, 
            worldY + offset - 2, 
            indicatorSize + 4, 
            indicatorSize + 4
        );
        this.ctx.restore();
        
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
    
    drawAchievementNotification(notification) {
        if (!notification) return;
        
        const { achievement, opacity } = notification;
        const x = this.canvas.width - 320;
        const y = 100;
        const width = 300;
        const height = 100;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(x, y, width, height);
        
        // Gold border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);
        
        // Achievement unlocked text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ACHIEVEMENT UNLOCKED!', x + width/2, y + 25);
        
        // Icon
        this.ctx.font = '24px Arial';
        this.ctx.fillText(achievement.icon, x + 30, y + 60);
        
        // Name and description
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(achievement.name, x + 60, y + 55);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText(achievement.description, x + 60, y + 75);
        
        this.ctx.restore();
    }
    
    drawRegenerationMessage(message, timeRemaining) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 + 100; // Below center
        
        // Fade in/out effect
        let opacity = 1;
        if (timeRemaining < 1000) {
            opacity = timeRemaining / 1000;
        } else if (timeRemaining > 4000) {
            opacity = (5000 - timeRemaining) / 1000;
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        
        // Large background box
        const boxWidth = 700;
        const boxHeight = 120;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(centerX - boxWidth/2, centerY - boxHeight/2, boxWidth, boxHeight);
        
        // Purple/blue mystical border
        const gradient = this.ctx.createLinearGradient(
            centerX - boxWidth/2, centerY,
            centerX + boxWidth/2, centerY
        );
        gradient.addColorStop(0, '#9400D3');
        gradient.addColorStop(0.5, '#4B0082');
        gradient.addColorStop(1, '#9400D3');
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(centerX - boxWidth/2, centerY - boxHeight/2, boxWidth, boxHeight);
        
        // Message text with glow effect
        this.ctx.shadowColor = '#9400D3';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#E6E6FA'; // Lavender
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(message, centerX, centerY);
        
        // Add mystical particles
        const time = Date.now() / 100;
        this.ctx.shadowBlur = 0;
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2 + time * 0.02;
            const radius = boxWidth/2 + 50 + Math.sin(time * 0.1 + i) * 30;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius * 0.3;
            
            const particleOpacity = 0.3 + Math.sin(time * 0.2 + i) * 0.3;
            this.ctx.globalAlpha = opacity * particleOpacity;
            this.ctx.fillStyle = '#E6E6FA';
            
            const size = 4 + Math.sin(time * 0.3 + i) * 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawMarketNotifications(marketManager) {
        const notifications = marketManager.getActiveNotifications();
        let yOffset = 200; // Start below other notifications
        
        for (const notification of notifications) {
            const elapsed = Date.now() - notification.startTime;
            const opacity = Math.min(1, Math.max(0, 1 - (elapsed - notification.duration + 1000) / 1000));
            
            if (opacity > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = opacity;
                
                const x = this.canvas.width - 350;
                const y = yOffset;
                const width = 330;
                const height = 80;
                
                // Background
                this.ctx.fillStyle = 'rgba(138, 43, 226, 0.9)'; // Purple background
                this.ctx.fillRect(x, y, width, height);
                
                // Border
                this.ctx.strokeStyle = '#E6E6FA';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x, y, width, height);
                
                // Icon
                this.ctx.font = '28px Arial';
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillText(notification.icon, x + 20, y + 45);
                
                // Title
                this.ctx.font = 'bold 18px Arial';
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillText(notification.title, x + 65, y + 35);
                
                // Message
                this.ctx.font = '14px Arial';
                this.ctx.fillStyle = '#E6E6FA';
                this.ctx.fillText(notification.message, x + 65, y + 55);
                
                this.ctx.restore();
                
                yOffset += 90;
            }
        }
    }
    
    drawMarketTicker(marketManager) {
        const summary = marketManager.getMarketSummary();
        const tickerHeight = 40;
        const y = this.canvas.height - tickerHeight;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, y, this.canvas.width, tickerHeight);
        
        // Border
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
        
        // Market label
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('MARKET:', 10, y + 25);
        
        // Ore prices
        const ores = ['iron', 'copper', 'silver', 'gold'];
        const oreColors = {
            iron: '#525252',
            copper: '#B87333',
            silver: '#C0C0C0',
            gold: '#FFD700'
        };
        
        let xOffset = 80;
        for (const ore of ores) {
            const price = summary.prices[ore];
            const trend = summary.trends[ore];
            const change = summary.changes[ore];
            const arrow = marketManager.getTrendArrow(ore);
            const trendColor = marketManager.getTrendColor(ore);
            
            // Ore name
            this.ctx.fillStyle = oreColors[ore];
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(ore.toUpperCase(), xOffset, y + 20);
            
            // Price
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`$${price}`, xOffset + 50, y + 20);
            
            // Trend arrow and percentage
            this.ctx.fillStyle = trendColor;
            this.ctx.font = '14px Arial';
            this.ctx.fillText(arrow, xOffset + 90, y + 20);
            
            this.ctx.font = '11px Arial';
            const changeText = change >= 0 ? `+${change}%` : `${change}%`;
            this.ctx.fillText(changeText, xOffset + 105, y + 20);
            
            xOffset += 160;
        }
        
        // Show active event if any
        if (summary.activeEvent) {
            this.ctx.fillStyle = '#E6E6FA';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'right';
            const eventText = `${summary.activeEvent.icon} ${summary.activeEvent.name} (${summary.eventTimeRemaining}s)`;
            this.ctx.fillText(eventText, this.canvas.width - 10, y + 25);
        }
        
        // Reset text align
        this.ctx.textAlign = 'left';
    }
    
    drawTeleportEffect(playerState, effectTime) {
        const maxTime = 500; // 500ms effect duration
        const progress = effectTime / maxTime;
        
        // Calculate effect parameters
        const centerX = playerState.x;
        const centerY = playerState.y - PLAYER_SIZE / 2;
        
        this.ctx.save();
        
        // Flash effect - bright cyan/white flash that fades
        const flashOpacity = progress * 0.6;
        this.ctx.globalAlpha = flashOpacity;
        this.ctx.fillStyle = '#00FFFF';
        
        // Draw expanding rings
        for (let i = 0; i < 3; i++) {
            const ringProgress = (1 - progress) + (i * 0.2);
            if (ringProgress > 0 && ringProgress < 1) {
                const radius = ringProgress * 100;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#00FFFF';
                this.ctx.lineWidth = 3 * (1 - ringProgress);
                this.ctx.stroke();
            }
        }
        
        // Draw particle burst
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = (1 - progress) * 80;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            this.ctx.globalAlpha = progress;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(x - 2, y - 2, 4, 4);
        }
        
        this.ctx.restore();
        
        // Also add a screen flash effect
        if (progress > 0.8) {
            this.ctx.save();
            this.ctx.globalAlpha = (progress - 0.8) * 2.5; // Quick flash at the end
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }
}