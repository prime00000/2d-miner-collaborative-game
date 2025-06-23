// Game configuration constants
export const TILE_SIZE = 24;
export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 15;

// Canvas and UI dimensions
export const CANVAS_WIDTH = TILE_SIZE * GRID_WIDTH;
export const CANVAS_HEIGHT = TILE_SIZE * GRID_HEIGHT;

// Valuables with base values and rarity
export const VALUABLES = {
    coal: { 
        value: 5, 
        rarity: 'common',
        color: '#333333',
        name: 'Coal'
    },
    iron: { 
        value: 10, 
        rarity: 'common',
        color: '#8B7355',
        name: 'Iron'
    },
    silver: { 
        value: 30, 
        rarity: 'uncommon',
        color: '#C0C0C0',
        name: 'Silver'
    },
    gold: { 
        value: 50, 
        rarity: 'uncommon',
        color: '#FFD700',
        name: 'Gold'
    },
    platinum: { 
        value: 100, 
        rarity: 'rare',
        color: '#E5E4E2',
        name: 'Platinum'
    },
    ruby: { 
        value: 200, 
        rarity: 'veryRare',
        color: '#E0115F',
        name: 'Ruby'
    },
    emerald: { 
        value: 180, 
        rarity: 'veryRare',
        color: '#50C878',
        name: 'Emerald'
    },
    diamond: { 
        value: 300, 
        rarity: 'ultraRare',
        color: '#B9F2FF',
        name: 'Diamond'
    },
    sapphire: { 
        value: 150, 
        rarity: 'veryRare',
        color: '#0F52BA',
        name: 'Sapphire'
    }
};

// Depth warrants and their costs
export const DEPTH_WARRANTS = {
    surface: { depth: 0, cost: 0, name: 'Surface' },
    shallow: { depth: 50, cost: 500, name: 'Shallow' },
    medium: { depth: 100, cost: 1500, name: 'Medium' },
    deep: { depth: 200, cost: 5000, name: 'Deep' },
    core: { depth: 500, cost: 20000, name: 'Core' }
};

// Initial player stats
export const INITIAL_STATS = {
    health: 100,
    maxHealth: 100,
    fuel: 100,
    maxFuel: 100,
    cash: 100,
    inventoryCapacity: 10
};

// Hazard damage values
export const HAZARDS = {
    waterSpring: {
        damage: 20,
        valuablesLoss: 0.3,
        name: 'Water Spring'
    },
    caveCollapse: {
        damage: 15,
        valuablesLoss: 0.2,
        collapseRadius: 3,
        name: 'Cave Collapse'
    },
    gasPocket: {
        damagePerSecond: 5,
        name: 'Gas Pocket'
    }
};

// Upgrade base costs and multipliers
export const UPGRADES = {
    fuelTank: {
        baseCost: 100,
        costMultiplier: 1.5,
        baseValue: 100,
        increment: 50,
        maxLevel: 10
    },
    carryingCapacity: {
        baseCost: 150,
        costMultiplier: 1.4,
        baseValue: 10,
        increment: 5,
        maxLevel: 10
    },
    protectiveGear: {
        baseCost: 200,
        costMultiplier: 1.6,
        damageReduction: 0.1,
        maxLevel: 5
    },
    miningSpeed: {
        baseCost: 250,
        costMultiplier: 1.7,
        speedIncrease: 0.2,
        maxLevel: 5
    }
};

// Game physics and timing
export const PHYSICS = {
    gravity: 0.5,
    maxFallSpeed: 10,
    playerSpeed: 5,
    miningTime: 1000, // milliseconds
    animationFPS: 60
};

// Tile types
export const TILE_TYPES = {
    EMPTY: 0,
    DIRT: 1,
    STONE: 2,
    BEDROCK: 3,
    ELEVATOR: 4,
    LADDER: 5,
    WATER: 6,
    GAS: 7
};

// Directions
export const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// UI Layout constants
export const UI_LAYOUT = {
    topBarHeight: 60,
    bottomBarHeight: 80,
    sidebarWidth: 200,
    buttonHeight: 40,
    buttonMargin: 10,
    fontSize: {
        small: 12,
        medium: 16,
        large: 20
    }
};

// Colors
export const COLORS = {
    background: '#1a1a1a',
    dirt: '#8B4513',
    stone: '#696969',
    bedrock: '#2F4F4F',
    elevator: '#FFD700',
    ladder: '#8B4513',
    water: '#4169E1',
    gas: '#98FB98',
    ui: {
        primary: '#FFD700',
        secondary: '#C0C0C0',
        danger: '#FF4444',
        success: '#44FF44',
        background: '#2a2a2a',
        text: '#FFFFFF'
    }
};

// Save data keys
export const SAVE_KEYS = {
    GAME_STATE: '2d_miner_game_state',
    SETTINGS: '2d_miner_settings',
    STATISTICS: '2d_miner_statistics'
};

// Z-index layers
export const Z_LAYERS = {
    BACKGROUND: 0,
    TILES: 1,
    ENTITIES: 2,
    PLAYER: 3,
    EFFECTS: 4,
    UI: 5,
    MODAL: 6
};