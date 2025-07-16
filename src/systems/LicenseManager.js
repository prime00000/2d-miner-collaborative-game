import { LICENSES, getNextLicense } from '../core/Licenses.js';

export class LicenseManager {
    constructor(gameState) {
        this.gameState = gameState;
    }
    
    // Get current license object
    getCurrentLicense() {
        const licenseId = this.gameState.currentLicense || 'surface';
        return LICENSES[licenseId.toUpperCase()] || LICENSES.SURFACE;
    }
    
    // Get max allowed depth
    getMaxDepth() {
        return this.getCurrentLicense().maxDepth;
    }
    
    // Check if player can mine at depth
    canMineAtDepth(depth) {
        return depth <= this.getMaxDepth();
    }
    
    // Get next available license
    getNextAvailableLicense() {
        const nextId = getNextLicense(this.gameState.currentLicense);
        if (!nextId) return null;
        return LICENSES[nextId.toUpperCase()];
    }
    
    // Check if requirements are met for a license
    checkRequirements(licenseId) {
        const license = LICENSES[licenseId.toUpperCase()];
        if (!license || !license.requirements) return true;
        
        const { stats, resources, upgrades, achievements } = this.gameState;
        const reqs = license.requirements;
        
        // Check each requirement
        if (reqs.totalOresCollected !== undefined && stats.totalOresCollected < reqs.totalOresCollected) {
            return false;
        }
        
        if (reqs.totalMoneyEarned !== undefined && stats.totalMoneyEarned < reqs.totalMoneyEarned) {
            return false;
        }
        
        if (reqs.copperCollected !== undefined && stats.copperCollected < reqs.copperCollected) {
            return false;
        }
        
        if (reqs.silverCollected !== undefined && stats.silverCollected < reqs.silverCollected) {
            return false;
        }
        
        if (reqs.goldCollected !== undefined && stats.goldCollected < reqs.goldCollected) {
            return false;
        }
        
        if (reqs.deepDives45m !== undefined && stats.deepDives45m < reqs.deepDives45m) {
            return false;
        }
        
        if (reqs.totalTilesMined !== undefined && stats.totalTilesMined < reqs.totalTilesMined) {
            return false;
        }
        
        if (reqs.survivedTo90m !== undefined && !stats.survivedTo90m) {
            return false;
        }
        
        if (reqs.hasDiamondPickaxe && !upgrades.diamondPickaxe) {
            return false;
        }
        
        if (reqs.cashOnHand !== undefined && resources.cash < reqs.cashOnHand) {
            return false;
        }
        
        if (reqs.hasDeepDiggerAchievement && !achievements.DEEP_DIGGER.unlocked) {
            return false;
        }
        
        return true;
    }
    
    // Purchase license
    purchaseLicense(licenseId) {
        const license = LICENSES[licenseId.toUpperCase()];
        if (!license) return false;
        
        // Check requirements
        if (!this.checkRequirements(licenseId)) {
            return false;
        }
        
        // Check price
        if (this.gameState.resources.cash < license.price) {
            return false;
        }
        
        // Purchase it
        this.gameState.resources.cash -= license.price;
        this.gameState.currentLicense = licenseId;
        
        // Track the purchase in statistics
        if (this.gameState.statistics) {
            this.gameState.statistics.updateEconomicStats('spent', license.price);
        }
        
        // Update elevator max depth
        this.gameState.elevator.maxDepth = license.maxDepth;
        
        return true;
    }
    
    // Get requirements status for display
    getRequirementsStatus(licenseId) {
        const license = LICENSES[licenseId.toUpperCase()];
        if (!license || !license.requirements) return [];
        
        const { stats, resources, upgrades, achievements } = this.gameState;
        const reqs = license.requirements;
        const status = [];
        
        if (reqs.totalOresCollected !== undefined) {
            status.push({
                name: `Collect ${reqs.totalOresCollected} total ores`,
                met: stats.totalOresCollected >= reqs.totalOresCollected,
                progress: `${stats.totalOresCollected}/${reqs.totalOresCollected}`
            });
        }
        
        if (reqs.totalMoneyEarned !== undefined) {
            status.push({
                name: `Earn $${reqs.totalMoneyEarned.toLocaleString()}`,
                met: stats.totalMoneyEarned >= reqs.totalMoneyEarned,
                progress: `$${Math.floor(stats.totalMoneyEarned)}/$${reqs.totalMoneyEarned}`
            });
        }
        
        if (reqs.copperCollected !== undefined) {
            status.push({
                name: `Collect ${reqs.copperCollected} copper ores`,
                met: stats.copperCollected >= reqs.copperCollected,
                progress: `${stats.copperCollected}/${reqs.copperCollected}`
            });
        }
        
        if (reqs.silverCollected !== undefined) {
            status.push({
                name: `Collect ${reqs.silverCollected} silver ores`,
                met: stats.silverCollected >= reqs.silverCollected,
                progress: `${stats.silverCollected}/${reqs.silverCollected}`
            });
        }
        
        if (reqs.goldCollected !== undefined) {
            status.push({
                name: `Collect ${reqs.goldCollected} gold ores`,
                met: stats.goldCollected >= reqs.goldCollected,
                progress: `${stats.goldCollected}/${reqs.goldCollected}`
            });
        }
        
        if (reqs.deepDives45m !== undefined) {
            status.push({
                name: `Reach 45m depth ${reqs.deepDives45m} times`,
                met: stats.deepDives45m >= reqs.deepDives45m,
                progress: `${stats.deepDives45m}/${reqs.deepDives45m}`
            });
        }
        
        if (reqs.totalTilesMined !== undefined) {
            status.push({
                name: `Mine ${reqs.totalTilesMined} total tiles`,
                met: stats.totalTilesMined >= reqs.totalTilesMined,
                progress: `${stats.totalTilesMined}/${reqs.totalTilesMined}`
            });
        }
        
        if (reqs.survivedTo90m !== undefined) {
            status.push({
                name: 'Survive to 90m depth without dying',
                met: stats.survivedTo90m,
                progress: stats.survivedTo90m ? 'Complete' : 'Incomplete'
            });
        }
        
        if (reqs.hasDiamondPickaxe) {
            status.push({
                name: 'Own Diamond Pickaxe',
                met: upgrades.diamondPickaxe,
                progress: upgrades.diamondPickaxe ? 'Owned' : 'Not owned'
            });
        }
        
        if (reqs.cashOnHand !== undefined) {
            status.push({
                name: `Have $${reqs.cashOnHand.toLocaleString()} cash on hand`,
                met: resources.cash >= reqs.cashOnHand,
                progress: `$${Math.floor(resources.cash)}/$${reqs.cashOnHand}`
            });
        }
        
        if (reqs.hasDeepDiggerAchievement) {
            status.push({
                name: 'Complete "Deep Digger" achievement',
                met: achievements.DEEP_DIGGER.unlocked,
                progress: achievements.DEEP_DIGGER.unlocked ? 'Complete' : 'Incomplete'
            });
        }
        
        return status;
    }
}