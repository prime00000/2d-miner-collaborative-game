// Game configuration constants
export const TILE_SIZE = 32;
export const SURFACE_Y = 200;
export const BUILDING_HEIGHT = 64;
export const BUILDING_WIDTH = 96;
export const PLAYER_SIZE = TILE_SIZE; // Player height matches tile size
export const ELEVATOR_SHAFT_WIDTH = TILE_SIZE * 2; // 64 pixels (2 tiles)
export const MAX_DEPTH = 50; // 50m initially unlocked

// Movement constants
export const PLAYER_SPEED = 150; // pixels per second
export const ELEVATOR_PROXIMITY = 30; // distance to activate elevator

// Building configurations
// Elevator positioned so its center is on a tile boundary (between tiles 6 and 7)
// This allows the 2-tile shaft to be perfectly centered
export const BUILDINGS = {
    elevator: { x: 176, color: '#808080', label: 'ELEVATOR' }, // Center at x=224 (7 tiles)
    store: { x: 48, color: '#8B4513', label: 'STORE' }, // 128 pixels left of elevator
    assayer: { x: 304, color: '#800080', label: 'ASSAYER' }, // 128 pixels right of elevator
    medical: { x: 432, color: '#228B22', label: 'MEDICAL' } // 256 pixels right of elevator
};

// Colors
export const COLORS = {
    sky: '#87CEEB',
    surface: '#8B7355',
    underground: '#654321',
    elevatorShaft: '#2a2a2a',
    ladder: '#666',
    player: '#FF6B6B',
    playerIndicator: '#FFF',
    depthMarker: '#888',
    uiBackground: 'rgba(0, 0, 0, 0.7)',
    uiText: 'white'
};

// Initial resources
export const INITIAL_RESOURCES = {
    health: 100,
    maxHealth: 100,
    energy: 1000,  // Increased for testing
    maxEnergy: 1000, // Increased to match
    cash: 500  // Increased for testing
};

// UI Constants
export const UI = {
    font: {
        small: '12px Arial',
        medium: '14px Arial',
        mediumBold: 'bold 14px Arial',
        large: '16px Arial'
    },
    depthMarkerInterval: 10, // Show depth marker every 10m
    ladderRungSpacing: 20
};

// World Constants
export const WORLD = {
    width: 32, // tiles wide
    depth: 200, // tiles deep
    tileSize: TILE_SIZE
};

// Tile Types
export const TILE_TYPES = {
    EMPTY: 0,
    DIRT: 1,
    CLAY: 2,
    STONE: 3,
    IRON: 4,
    COPPER: 5,
    SILVER: 6,
    GOLD: 7
};

// Tile Properties
export const TILE_PROPERTIES = {
    [TILE_TYPES.EMPTY]: { 
        energyCost: 0, 
        color: 'transparent',
        name: 'Empty',
        value: 0
    },
    [TILE_TYPES.DIRT]: { 
        energyCost: 10, 
        color: '#8B6914',
        name: 'Dirt',
        value: 0
    },
    [TILE_TYPES.CLAY]: { 
        energyCost: 20, 
        color: '#B22222', // Rich red
        name: 'Clay',
        value: 0
    },
    [TILE_TYPES.STONE]: { 
        energyCost: 40, 
        color: '#696969',
        name: 'Stone',
        value: 0
    },
    [TILE_TYPES.IRON]: { 
        energyCost: 60, 
        color: '#525252', // Dark gray
        name: 'Iron Ore',
        value: 5,
        isOre: true
    },
    [TILE_TYPES.COPPER]: { 
        energyCost: 40, 
        color: '#B87333', // Copper color
        name: 'Copper Ore',
        value: 10,
        isOre: true
    },
    [TILE_TYPES.SILVER]: { 
        energyCost: 40, 
        color: '#C0C0C0', // Silver
        name: 'Silver Ore',
        value: 20,
        isOre: true
    },
    [TILE_TYPES.GOLD]: { 
        energyCost: 40, 
        color: '#FFD700', // Gold
        name: 'Gold Ore',
        value: 50,
        isOre: true
    }
};

// Base ore probabilities (as percentages)
export const ORE_PROBABILITIES = {
    clay: 10.0,
    stone: 8.0,
    iron: 4.0,
    copper: 2.5,
    silver: 1.5,
    gold: 0.8
};

// Ore quantity chances (upgradeable)
export const ORE_QUANTITY_CHANCES = {
    one: 60,    // 60% chance for 1 ore
    two: 30,    // 30% chance for 2 ores
    five: 7,    // 7% chance for 5 ores
    ten: 3      // 3% chance for 10 ores
};

// Resource prices (variable for market fluctuations)
export const RESOURCE_PRICES = {
    // Selling prices (at Assayer)
    iron: 5,
    copper: 10,
    silver: 20,
    gold: 50,
    
    // Buying prices (at Store)
    energy: 0.1,  // $0.10 per unit of energy (so 100 energy = $10)
    improvedPickaxe: 500
};