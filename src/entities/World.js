import { GRID_WIDTH, GRID_HEIGHT, TILE_TYPES, VALUABLES } from '../core/Constants.js';

export class World {
    constructor() {
        this.grid = [];
        this.elevatorPosition = { x: Math.floor(GRID_WIDTH / 2), y: 0 };
        this.currentDepth = 0;
        this.visibleTiles = new Set(); // Track which tiles have been revealed
        this.initialize();
    }

    initialize() {
        // Initialize empty grid
        for (let y = 0; y < GRID_HEIGHT; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                this.grid[y][x] = {
                    type: TILE_TYPES.EMPTY,
                    valuable: null,
                    revealed: false,
                    hazard: null
                };
            }
        }
    }

    // Generate world for a specific depth
    generateForDepth(depth) {
        this.currentDepth = depth;
        this.visibleTiles.clear();
        
        // Clear and regenerate grid
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (depth === 0) {
                    // Surface level - mostly empty with some dirt
                    this.grid[y][x] = this.generateSurfaceTile(x, y);
                } else {
                    // Underground - filled with tiles
                    this.grid[y][x] = this.generateTile(x, y, depth);
                }
            }
        }

        // Place elevator
        this.placeElevator();
        
        // Create initial safe zone around elevator
        this.createSafeZone(this.elevatorPosition.x, this.elevatorPosition.y, 3);
    }

    // Generate surface tile
    generateSurfaceTile(x, y) {
        const tile = {
            type: TILE_TYPES.EMPTY,
            valuable: null,
            revealed: true,
            hazard: null
        };

        // Ground level
        if (y >= GRID_HEIGHT - 3) {
            tile.type = TILE_TYPES.DIRT;
        }

        return tile;
    }

    // Generate underground tile based on depth
    generateTile(x, y, depth) {
        const tile = {
            type: TILE_TYPES.DIRT,
            valuable: null,
            revealed: false,
            hazard: null
        };

        // Determine tile type based on depth
        const stoneChance = Math.min(0.3 + (depth / 1000), 0.7);
        if (Math.random() < stoneChance) {
            tile.type = TILE_TYPES.STONE;
        }

        // Add bedrock at very deep levels
        if (depth >= 400 && Math.random() < 0.1) {
            tile.type = TILE_TYPES.BEDROCK;
            return tile; // Bedrock can't contain valuables
        }

        // Generate valuables based on depth-adjusted rarity
        const valuableRoll = Math.random();
        const valuable = this.generateValuable(valuableRoll, depth);
        if (valuable) {
            tile.valuable = valuable;
        }

        // Generate hazards (more common at deeper levels)
        const hazardChance = Math.min(0.05 + (depth / 2000), 0.15);
        if (Math.random() < hazardChance) {
            tile.hazard = this.generateHazard(depth);
        }

        return tile;
    }

    // Generate valuable based on depth and rarity
    generateValuable(roll, depth) {
        // Depth-based rarity adjustments
        const depthMultiplier = 1 + (depth / 500);
        
        // Define rarity thresholds (adjusted by depth)
        const thresholds = {
            common: 0.15 * depthMultiplier,
            uncommon: 0.08 * depthMultiplier,
            rare: 0.04 * depthMultiplier,
            veryRare: 0.02 * depthMultiplier,
            ultraRare: 0.005 * depthMultiplier
        };

        // Check from rarest to most common
        if (roll < thresholds.ultraRare) {
            // Ultra rare - only diamond at deep levels
            if (depth >= 200) {
                return 'diamond';
            }
        }
        
        if (roll < thresholds.veryRare) {
            // Very rare valuables
            const veryRareOptions = ['ruby', 'emerald', 'sapphire'];
            if (depth >= 100) {
                return veryRareOptions[Math.floor(Math.random() * veryRareOptions.length)];
            }
        }
        
        if (roll < thresholds.rare) {
            // Rare valuables
            if (depth >= 50) {
                return 'platinum';
            }
        }
        
        if (roll < thresholds.uncommon) {
            // Uncommon valuables
            const uncommonOptions = ['silver', 'gold'];
            if (depth >= 25) {
                return uncommonOptions[Math.floor(Math.random() * uncommonOptions.length)];
            }
        }
        
        if (roll < thresholds.common) {
            // Common valuables
            const commonOptions = ['coal', 'iron'];
            return commonOptions[Math.floor(Math.random() * commonOptions.length)];
        }

        return null;
    }

    // Generate hazard based on depth
    generateHazard(depth) {
        const hazardRoll = Math.random();
        
        // Water springs more common at medium depths
        if (depth >= 50 && depth <= 200 && hazardRoll < 0.6) {
            return 'waterSpring';
        }
        
        // Cave collapses more common at deeper levels
        if (depth >= 100 && hazardRoll < 0.4) {
            return 'caveCollapse';
        }
        
        // Gas pockets at very deep levels (future feature)
        if (depth >= 300 && hazardRoll < 0.2) {
            return 'gasPocket';
        }

        return null;
    }

    // Place elevator at designated position
    placeElevator() {
        const tile = this.getTile(this.elevatorPosition.x, this.elevatorPosition.y);
        if (tile) {
            tile.type = TILE_TYPES.ELEVATOR;
            tile.revealed = true;
            tile.valuable = null;
            tile.hazard = null;
        }
    }

    // Create safe zone around a position
    createSafeZone(centerX, centerY, radius) {
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (distance <= radius) {
                    const tile = this.getTile(x, y);
                    if (tile && tile.type !== TILE_TYPES.ELEVATOR) {
                        tile.type = TILE_TYPES.EMPTY;
                        tile.valuable = null;
                        tile.hazard = null;
                        tile.revealed = true;
                    }
                }
            }
        }
    }

    // Get tile at position
    getTile(x, y) {
        if (this.isValidPosition(x, y)) {
            return this.grid[y][x];
        }
        return null;
    }

    // Set tile at position
    setTile(x, y, tile) {
        if (this.isValidPosition(x, y)) {
            this.grid[y][x] = tile;
            return true;
        }
        return false;
    }

    // Update tile type
    setTileType(x, y, type) {
        const tile = this.getTile(x, y);
        if (tile) {
            tile.type = type;
            return true;
        }
        return false;
    }

    // Remove valuable from tile
    removeValuable(x, y) {
        const tile = this.getTile(x, y);
        if (tile && tile.valuable) {
            const valuable = tile.valuable;
            tile.valuable = null;
            return valuable;
        }
        return null;
    }

    // Reveal tile
    revealTile(x, y) {
        const tile = this.getTile(x, y);
        if (tile && !tile.revealed) {
            tile.revealed = true;
            this.visibleTiles.add(`${x},${y}`);
            return true;
        }
        return false;
    }

    // Reveal tiles in radius
    revealRadius(centerX, centerY, radius) {
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (distance <= radius) {
                    this.revealTile(x, y);
                }
            }
        }
    }

    // Check if position is valid
    isValidPosition(x, y) {
        return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
    }

    // Check if tile is solid (can't pass through)
    isSolid(x, y) {
        const tile = this.getTile(x, y);
        if (!tile) return true;
        
        return tile.type === TILE_TYPES.DIRT || 
               tile.type === TILE_TYPES.STONE || 
               tile.type === TILE_TYPES.BEDROCK;
    }

    // Check if tile is mineable
    isMineable(x, y) {
        const tile = this.getTile(x, y);
        if (!tile) return false;
        
        return tile.type === TILE_TYPES.DIRT || 
               tile.type === TILE_TYPES.STONE;
    }

    // Mine tile (convert to empty)
    mineTile(x, y) {
        const tile = this.getTile(x, y);
        if (tile && this.isMineable(x, y)) {
            const valuable = tile.valuable;
            const hazard = tile.hazard;
            
            tile.type = TILE_TYPES.EMPTY;
            tile.valuable = null;
            tile.hazard = null;
            
            return { valuable, hazard };
        }
        return { valuable: null, hazard: null };
    }

    // Trigger hazard effects
    triggerHazard(x, y, hazardType) {
        switch (hazardType) {
            case 'waterSpring':
                this.floodArea(x, y);
                break;
            case 'caveCollapse':
                this.collapseArea(x, y, 3);
                break;
            case 'gasPocket':
                this.releaseGas(x, y);
                break;
        }
    }

    // Flood area with water
    floodArea(startX, startY) {
        const flooded = new Set();
        const queue = [{x: startX, y: startY}];
        
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            const key = `${x},${y}`;
            
            if (flooded.has(key)) continue;
            
            const tile = this.getTile(x, y);
            if (tile && tile.type === TILE_TYPES.EMPTY) {
                tile.type = TILE_TYPES.WATER;
                flooded.add(key);
                
                // Add adjacent empty tiles to queue
                const adjacent = [
                    {x: x + 1, y},
                    {x: x - 1, y},
                    {x, y: y + 1},
                    {x, y: y - 1}
                ];
                
                for (const pos of adjacent) {
                    if (this.isValidPosition(pos.x, pos.y)) {
                        queue.push(pos);
                    }
                }
            }
        }
    }

    // Collapse area
    collapseArea(centerX, centerY, radius) {
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (distance <= radius) {
                    const tile = this.getTile(x, y);
                    if (tile && tile.type === TILE_TYPES.EMPTY) {
                        tile.type = TILE_TYPES.DIRT;
                        tile.valuable = null;
                    }
                }
            }
        }
    }

    // Release gas in area
    releaseGas(centerX, centerY) {
        // Placeholder for gas pocket implementation
        const radius = 4;
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (distance <= radius) {
                    const tile = this.getTile(x, y);
                    if (tile && tile.type === TILE_TYPES.EMPTY) {
                        tile.type = TILE_TYPES.GAS;
                    }
                }
            }
        }
    }

    // Get distance to elevator
    getDistanceToElevator(x, y) {
        return Math.sqrt(
            Math.pow(x - this.elevatorPosition.x, 2) + 
            Math.pow(y - this.elevatorPosition.y, 2)
        );
    }

    // Serialize world data
    toJSON() {
        return {
            grid: this.grid,
            elevatorPosition: this.elevatorPosition,
            currentDepth: this.currentDepth,
            visibleTiles: Array.from(this.visibleTiles)
        };
    }

    // Deserialize world data
    fromJSON(data) {
        this.grid = data.grid;
        this.elevatorPosition = data.elevatorPosition;
        this.currentDepth = data.currentDepth;
        this.visibleTiles = new Set(data.visibleTiles);
    }
}