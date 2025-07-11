export const ACHIEVEMENTS = {
    FIRST_GOLD: {
        id: 'first_gold',
        name: 'First Gold!',
        description: 'Find your first gold ore',
        icon: '🏆',
        unlocked: false
    },
    DEEP_DIGGER: {
        id: 'deep_digger',
        name: 'Deep Digger',
        description: 'Reach 50 meters depth',
        icon: '⛏️',
        unlocked: false
    },
    ORE_COLLECTOR: {
        id: 'ore_collector',
        name: 'Ore Collector',
        description: 'Collect 100 total ores',
        icon: '💎',
        unlocked: false
    },
    SURFACE_SCRATCHER: {
        id: 'surface_scratcher',
        name: 'Surface Scratcher',
        description: 'Mine 100 tiles',
        icon: '🔨',
        unlocked: false
    },
    THOUSAND_AIRE: {
        id: 'thousand_aire',
        name: 'Thousand-aire',
        description: 'Earn $1000 total',
        icon: '💰',
        unlocked: false
    },
    LUCKY_STRIKE: {
        id: 'lucky_strike',
        name: 'Lucky Strike',
        description: 'Find ore in 5 consecutive digs',
        icon: '🍀',
        unlocked: false
    },
    SURVIVOR: {
        id: 'survivor',
        name: 'Survivor',
        description: 'Play 10 minutes without dying',
        icon: '🛡️',
        unlocked: false
    },
    ROCK_BOTTOM: {
        id: 'rock_bottom',
        name: 'Rock Bottom',
        description: 'Die for the first time (consolation prize)',
        icon: '💀',
        unlocked: false
    },
    ENERGY_CRISIS: {
        id: 'energy_crisis',
        name: 'Energy Crisis',
        description: 'Buy emergency energy underground',
        icon: '🔋',
        unlocked: false
    },
    FULL_POCKETS: {
        id: 'full_pockets',
        name: 'Full Pockets',
        description: 'Carry 50 ores at once',
        icon: '🎒',
        unlocked: false
    }
};

// Helper function to get a fresh copy of achievements
export function getInitialAchievements() {
    const achievements = {};
    for (const key in ACHIEVEMENTS) {
        achievements[key] = { ...ACHIEVEMENTS[key] };
    }
    return achievements;
}