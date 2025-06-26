import { WORLD, TILE_TYPES, TILE_PROPERTIES, SURFACE_Y, TILE_SIZE, MAX_DEPTH, ORE_PROBABILITIES } from '../core/Constants.js';

export class World {
    constructor() {
        // Use a Map for sparse array efficiency - only store non-empty tiles
        this.tiles = new Map();
        // Track revealed tiles for fog of war
        this.revealedTiles = new Set();
        this.generateWorld();
    }
    
    generateWorld() {
        // Generate tiles below surface
        const surfaceRow = Math.floor(SURFACE_Y / TILE_SIZE) + 1;
        
        for (let y = surfaceRow; y < WORLD.depth; y++) {
            for (let x = 0; x < WORLD.width; x++) {
                const tile = this.generateTile(x, y);
                if (tile.type !== TILE_TYPES.EMPTY) {
                    this.setTile(x, y, tile);
                }
            }
        }
    }
    
    generateTile(x, y) {
        // Calculate depth from surface
        const surfaceRow = Math.floor(SURFACE_Y / TILE_SIZE) + 1;
        const depth = y - surfaceRow;
        
        // Calculate depth scaling for ores (1% increase per depth^2, capped at 3x)
        const depthMultiplier = Math.min(3.0, 1.0 + (depth * depth * 0.01));
        
        // Calculate probabilities
        const probabilities = {
            clay: ORE_PROBABILITIES.clay, // Constant at all depths
            stone: ORE_PROBABILITIES.stone, // Constant at all depths
            iron: ORE_PROBABILITIES.iron * depthMultiplier,
            copper: ORE_PROBABILITIES.copper * depthMultiplier,
            silver: ORE_PROBABILITIES.silver * depthMultiplier,
            gold: ORE_PROBABILITIES.gold * depthMultiplier
        };
        
        // Generate tile based on probabilities
        const type = this.selectTileType(probabilities);
        
        return {
            type: type,
            fuelCost: TILE_PROPERTIES[type].fuelCost,
            value: TILE_PROPERTIES[type].value || 0,
            revealed: false // Start hidden for fog of war
        };
    }
    
    selectTileType(probabilities) {
        const roll = Math.random() * 100; // Roll 0-100
        let cumulative = 0;
        
        // Check each ore type
        if (roll < (cumulative += probabilities.gold)) return TILE_TYPES.GOLD;
        if (roll < (cumulative += probabilities.silver)) return TILE_TYPES.SILVER;
        if (roll < (cumulative += probabilities.copper)) return TILE_TYPES.COPPER;
        if (roll < (cumulative += probabilities.iron)) return TILE_TYPES.IRON;
        if (roll < (cumulative += probabilities.stone)) return TILE_TYPES.STONE;
        if (roll < (cumulative += probabilities.clay)) return TILE_TYPES.CLAY;
        
        // Everything else is dirt
        return TILE_TYPES.DIRT;
    }
    
    // Get tile at grid position
    getTile(x, y) {
        const key = `${x},${y}`;
        return this.tiles.get(key) || null;
    }
    
    // Set tile at grid position
    setTile(x, y, tile) {
        const key = `${x},${y}`;
        if (tile && tile.type !== TILE_TYPES.EMPTY) {
            this.tiles.set(key, tile);
        } else {
            this.tiles.delete(key);
        }
    }
    
    // Remove tile (mine it)
    removeTile(x, y) {
        const tile = this.getTile(x, y);
        if (tile) {
            // Reveal the tile when mined
            this.revealTile(x, y);
            this.tiles.delete(`${x},${y}`);
            return tile;
        }
        return null;
    }
    
    // Reveal a tile (fog of war)
    revealTile(x, y) {
        const key = `${x},${y}`;
        this.revealedTiles.add(key);
        const tile = this.getTile(x, y);
        if (tile) {
            tile.revealed = true;
        }
    }
    
    // Check if a tile is revealed
    isTileRevealed(x, y) {
        const key = `${x},${y}`;
        return this.revealedTiles.has(key);
    }
    
    // Reveal adjacent tiles with detection chance
    detectAdjacentTiles(centerX, centerY, detectionChance = 0.2) {
        const offsets = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],           [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
        ];
        
        for (const [dx, dy] of offsets) {
            const x = centerX + dx;
            const y = centerY + dy;
            if (Math.random() < detectionChance) {
                this.revealTile(x, y);
            }
        }
    }
    
    // Check if a position has a solid tile
    hasTile(x, y) {
        return this.tiles.has(`${x},${y}`);
    }
    
    // Get all tiles in a rectangular area (for rendering)
    getTilesInArea(startX, startY, endX, endY) {
        const tiles = [];
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const tile = this.getTile(x, y);
                if (tile) {
                    tiles.push({ x, y, tile });
                }
            }
        }
        return tiles;
    }
    
    // Convert world position to tile coordinates
    worldToTile(worldX, worldY) {
        return {
            x: Math.floor(worldX / TILE_SIZE),
            y: Math.floor(worldY / TILE_SIZE)
        };
    }
    
    // Convert tile coordinates to world position
    tileToWorld(tileX, tileY) {
        return {
            x: tileX * TILE_SIZE,
            y: tileY * TILE_SIZE
        };
    }
    
    // Check if player can mine at depth
    canMineAtDepth(depth) {
        return depth <= MAX_DEPTH; // 50m limit
    }
}