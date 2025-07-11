export class AchievementManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.unlockQueue = [];
        this.currentNotification = null;
        this.notificationTime = 0;
        this.notificationDuration = 3000; // 3 seconds
    }
    
    // Check and unlock achievement
    unlock(achievementKey) {
        const achievement = this.gameState.achievements[achievementKey];
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            achievement.unlockedAt = Date.now();
            this.unlockQueue.push(achievement);
            return true;
        }
        return false;
    }
    
    // Check all achievements based on current state
    checkAchievements() {
        const { achievements, stats, player, resources, inventory, upgrades } = this.gameState;
        
        // First Gold
        if (inventory.gold > 0 && !achievements.FIRST_GOLD.unlocked) {
            this.unlock('FIRST_GOLD');
        }
        
        // Deep Digger - 50m depth
        if (player.depth >= 50 && !achievements.DEEP_DIGGER.unlocked) {
            this.unlock('DEEP_DIGGER');
        }
        
        // Ore Collector - 100 total ores
        if (stats.totalOresCollected >= 100 && !achievements.ORE_COLLECTOR.unlocked) {
            this.unlock('ORE_COLLECTOR');
        }
        
        // Surface Scratcher - 100 tiles mined
        if (stats.totalTilesMined >= 100 && !achievements.SURFACE_SCRATCHER.unlocked) {
            this.unlock('SURFACE_SCRATCHER');
        }
        
        // Thousand-aire - $1000 earned total
        if (stats.totalMoneyEarned >= 1000 && !achievements.THOUSAND_AIRE.unlocked) {
            this.unlock('THOUSAND_AIRE');
        }
        
        // Survivor - 10 minutes without dying
        const timeSinceStart = Date.now() - stats.sessionStartTime;
        const timeSinceDeath = stats.lastDeathTime ? Date.now() - stats.lastDeathTime : timeSinceStart;
        if (timeSinceDeath >= 600000 && !achievements.SURVIVOR.unlocked) { // 600000ms = 10 minutes
            this.unlock('SURVIVOR');
        }
        
        // Full Pockets - 50 ores at once
        const totalOresInInventory = inventory.iron + inventory.copper + inventory.silver + inventory.gold;
        if (totalOresInInventory >= 50 && !achievements.FULL_POCKETS.unlocked) {
            this.unlock('FULL_POCKETS');
        }
    }
    
    // Check for Lucky Strike achievement (called when mining)
    checkLuckyStrike(foundOre) {
        if (foundOre) {
            this.gameState.stats.consecutiveOres++;
            if (this.gameState.stats.consecutiveOres >= 5 && !this.gameState.achievements.LUCKY_STRIKE.unlocked) {
                this.unlock('LUCKY_STRIKE');
            }
        } else {
            this.gameState.stats.consecutiveOres = 0;
        }
    }
    
    // Check for Rock Bottom achievement (called on death)
    checkRockBottom() {
        if (!this.gameState.stats.hasEverDied && !this.gameState.achievements.ROCK_BOTTOM.unlocked) {
            this.gameState.stats.hasEverDied = true;
            this.unlock('ROCK_BOTTOM');
        }
        this.gameState.stats.lastDeathTime = Date.now();
    }
    
    // Check for Energy Crisis achievement (called when buying emergency energy)
    checkEnergyCrisis() {
        if (!this.gameState.achievements.ENERGY_CRISIS.unlocked) {
            this.unlock('ENERGY_CRISIS');
        }
    }
    
    // Update notification display
    update(deltaTime) {
        // Process unlock queue
        if (!this.currentNotification && this.unlockQueue.length > 0) {
            this.currentNotification = this.unlockQueue.shift();
            this.notificationTime = this.notificationDuration;
        }
        
        // Update current notification
        if (this.currentNotification && this.notificationTime > 0) {
            this.notificationTime -= deltaTime * 1000;
            if (this.notificationTime <= 0) {
                this.currentNotification = null;
            }
        }
    }
    
    // Get current notification for rendering
    getCurrentNotification() {
        if (this.currentNotification && this.notificationTime > 0) {
            return {
                achievement: this.currentNotification,
                opacity: Math.min(1, this.notificationTime / 1000) // Fade out in last second
            };
        }
        return null;
    }
    
    // Get achievement progress
    getProgress() {
        const achievements = Object.values(this.gameState.achievements);
        const unlocked = achievements.filter(a => a.unlocked).length;
        const total = achievements.length;
        return { unlocked, total, percentage: Math.floor((unlocked / total) * 100) };
    }
}