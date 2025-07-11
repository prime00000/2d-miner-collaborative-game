export const LICENSES = {
    SURFACE: {
        id: 'surface',
        name: 'Surface License',
        description: 'Basic mining rights',
        maxDepth: 25,
        price: 0,
        requirements: {
            // No requirements for default license
        }
    },
    BASIC: {
        id: 'basic',
        name: 'Basic Mining License',
        description: 'Mine to 50 meters',
        maxDepth: 50,
        price: 1000,
        requirements: {
            totalOresCollected: 50,
            totalMoneyEarned: 500
        }
    },
    ADVANCED: {
        id: 'advanced',
        name: 'Advanced Mining License',
        description: 'Mine to 100 meters',
        maxDepth: 100,
        price: 5000,
        requirements: {
            copperCollected: 20,
            silverCollected: 10,
            deepDives45m: 5
        }
    },
    DEEP_EARTH: {
        id: 'deep_earth',
        name: 'Deep Earth License',
        description: 'Mine to 200 meters',
        maxDepth: 200,
        price: 10000,
        requirements: {
            goldCollected: 5,
            totalTilesMined: 500,
            survivedTo90m: true
        }
    },
    CORE_PROSPECTOR: {
        id: 'core_prospector',
        name: 'Core Prospector License',
        description: 'Unlimited depth access',
        maxDepth: Infinity,
        price: 20000,
        requirements: {
            hasDiamondPickaxe: true,
            cashOnHand: 10000,
            hasDeepDiggerAchievement: true
        }
    }
};

// License progression order
export const LICENSE_ORDER = ['surface', 'basic', 'advanced', 'deep_earth', 'core_prospector'];

// Get next available license
export function getNextLicense(currentLicense) {
    const currentIndex = LICENSE_ORDER.indexOf(currentLicense);
    if (currentIndex === -1 || currentIndex === LICENSE_ORDER.length - 1) {
        return null;
    }
    return LICENSE_ORDER[currentIndex + 1];
}