export class Statistics {
    constructor() {
        this.stats = this.loadStats() || this.getDefaultStats();
        this.sessionStartTime = Date.now();
        this.lastSaveTime = Date.now();
        this.autoSaveInterval = 30000; // Save every 30 seconds
        
        // Initialize rarest ore on load
        this.updateRarestOre();
    }
    
    getDefaultStats() {
        return {
            // Mining Stats
            mining: {
                totalTilesMined: 0,
                tilesMinedByType: {
                    dirt: 0,
                    clay: 0,
                    stone: 0,
                    iron: 0,
                    copper: 0,
                    silver: 0,
                    gold: 0
                },
                perfectDigs: 0, // Found ore
                emptyDigs: 0, // Found nothing valuable
                miningEfficiency: 0, // Percentage of digs that found ore
                deepestPointReached: 0,
                totalAreaExplored: 0,
                distanceTraveled: {
                    horizontal: 0,
                    vertical: 0,
                    total: 0
                }
            },
            
            // Economic Stats
            economic: {
                totalMoneyEarned: 0,
                moneySpentAtStore: 0,
                moneyLostToDeath: 0,
                bestSingleTransaction: 0,
                currentNetWorth: 0,
                averageOreSalePrice: 0,
                mostProfitableOreType: null,
                salesByOreType: {
                    iron: { count: 0, total: 0 },
                    copper: { count: 0, total: 0 },
                    silver: { count: 0, total: 0 },
                    gold: { count: 0, total: 0 }
                }
            },
            
            // Ore Collection Stats
            oreCollection: {
                totalOresCollected: 0,
                oresByType: {
                    iron: 0,
                    copper: 0,
                    silver: 0,
                    gold: 0
                },
                oresLostToDeath: 0,
                oresSold: 0,
                currentInventoryValue: 0,
                rarestOreFound: null,
                largestOreHaul: 0 // Most ores collected in one dig
            },
            
            // Time & Session Stats
            timeAndSession: {
                totalPlaytime: 0, // milliseconds
                currentSessionLength: 0,
                averageSessionLength: 0,
                longestSession: 0,
                timeUnderground: 0,
                timeSurface: 0,
                numberOfSessions: 1,
                firstPlayDate: Date.now(),
                lastPlayDate: Date.now()
            },
            
            // Survival Stats
            survival: {
                totalDeaths: 0,
                deathsByDepth: [], // Array of death depths
                deepestDeath: 0,
                damageFromEnemies: 0,
                damageFromFalls: 0,
                totalDamageTaken: 0,
                energyConsumed: 0,
                energyPurchased: 0,
                closestCall: 100, // Lowest HP survived
                longestSurvivalStreak: 0, // Time without dying
                currentSurvivalStreak: 0
            },
            
            // Achievement-related stats
            achievements: {
                luckyStrikes: 0, // 10 ore finds
                consecutivePerfectDigs: 0,
                currentConsecutivePerfectDigs: 0,
                deepDivesTo45m: 0,
                survivedTo90m: false,
                totalTilesMined: 0,
                hasReachedDepth: {
                    20: false,
                    50: false,
                    100: false,
                    200: false
                }
            }
        };
    }
    
    // Update methods
    updateMiningStats(tileType, foundOre = false) {
        this.stats.mining.totalTilesMined++;
        this.stats.achievements.totalTilesMined++;
        
        if (this.stats.mining.tilesMinedByType[tileType] !== undefined) {
            this.stats.mining.tilesMinedByType[tileType]++;
        }
        
        if (foundOre) {
            this.stats.mining.perfectDigs++;
            this.stats.achievements.currentConsecutivePerfectDigs++;
            if (this.stats.achievements.currentConsecutivePerfectDigs > this.stats.achievements.consecutivePerfectDigs) {
                this.stats.achievements.consecutivePerfectDigs = this.stats.achievements.currentConsecutivePerfectDigs;
            }
        } else {
            this.stats.mining.emptyDigs++;
            this.stats.achievements.currentConsecutivePerfectDigs = 0;
        }
        
        // Update mining efficiency
        const totalDigs = this.stats.mining.perfectDigs + this.stats.mining.emptyDigs;
        this.stats.mining.miningEfficiency = totalDigs > 0 
            ? Math.round((this.stats.mining.perfectDigs / totalDigs) * 100) 
            : 0;
        
        this.checkAutoSave();
    }
    
    updateDepth(depth) {
        if (depth > this.stats.mining.deepestPointReached) {
            this.stats.mining.deepestPointReached = depth;
        }
        
        // Check depth achievements
        [20, 50, 100, 200].forEach(milestone => {
            if (depth >= milestone && !this.stats.achievements.hasReachedDepth[milestone]) {
                this.stats.achievements.hasReachedDepth[milestone] = true;
            }
        });
        
        if (depth >= 45) {
            this.stats.achievements.deepDivesTo45m++;
        }
        
        if (depth >= 90) {
            this.stats.achievements.survivedTo90m = true;
        }
    }
    
    updateDistance(deltaX, deltaY) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        this.stats.mining.distanceTraveled.horizontal += absX;
        this.stats.mining.distanceTraveled.vertical += absY;
        this.stats.mining.distanceTraveled.total += absX + absY;
    }
    
    updateEconomicStats(type, amount, oreType = null) {
        switch(type) {
            case 'earned':
                this.stats.economic.totalMoneyEarned += amount;
                if (amount > this.stats.economic.bestSingleTransaction) {
                    this.stats.economic.bestSingleTransaction = amount;
                }
                break;
            case 'spent':
                this.stats.economic.moneySpentAtStore += amount;
                break;
            case 'lost':
                this.stats.economic.moneyLostToDeath += amount;
                break;
            case 'sale':
                if (oreType && this.stats.economic.salesByOreType[oreType]) {
                    this.stats.economic.salesByOreType[oreType].count++;
                    this.stats.economic.salesByOreType[oreType].total += amount;
                }
                break;
        }
        
        this.updateMostProfitableOre();
        this.checkAutoSave();
    }
    
    updateMostProfitableOre() {
        let bestOre = null;
        let bestAverage = 0;
        
        for (const [ore, data] of Object.entries(this.stats.economic.salesByOreType)) {
            if (data.count > 0) {
                const average = data.total / data.count;
                if (average > bestAverage) {
                    bestAverage = average;
                    bestOre = ore;
                }
            }
        }
        
        this.stats.economic.mostProfitableOreType = bestOre;
        this.stats.economic.averageOreSalePrice = bestAverage;
    }
    
    updateOreCollection(oreType, quantity) {
        this.stats.oreCollection.totalOresCollected += quantity;
        this.stats.oreCollection.oresByType[oreType] += quantity;
        
        if (quantity > this.stats.oreCollection.largestOreHaul) {
            this.stats.oreCollection.largestOreHaul = quantity;
        }
        
        // Update rarest ore (based on total collected)
        this.updateRarestOre();
        
        // Check lucky strike
        if (quantity >= 10) {
            this.stats.achievements.luckyStrikes++;
        }
        
        this.checkAutoSave();
    }
    
    updateRarestOre() {
        // Define ore rarity order (from most common to most rare)
        const oreRarity = {
            'iron': 1,    // Most common
            'copper': 2,
            'silver': 3,
            'gold': 4     // Most rare
        };
        
        let rarestOre = null;
        let highestRarity = 0;
        
        // Find the rarest ore type that has been collected
        for (const [ore, count] of Object.entries(this.stats.oreCollection.oresByType)) {
            if (count > 0 && oreRarity[ore] && oreRarity[ore] > highestRarity) {
                highestRarity = oreRarity[ore];
                rarestOre = ore;
            }
        }
        
        this.stats.oreCollection.rarestOreFound = rarestOre;
    }
    
    updateOresSold(quantity) {
        this.stats.oreCollection.oresSold += quantity;
    }
    
    updateInventoryValue(value) {
        this.stats.oreCollection.currentInventoryValue = value;
    }
    
    updateTimeStats() {
        const now = Date.now();
        const sessionLength = now - this.sessionStartTime;
        
        this.stats.timeAndSession.currentSessionLength = sessionLength;
        this.stats.timeAndSession.totalPlaytime += sessionLength;
        this.stats.timeAndSession.lastPlayDate = now;
        
        if (sessionLength > this.stats.timeAndSession.longestSession) {
            this.stats.timeAndSession.longestSession = sessionLength;
        }
        
        // Update average session length
        const totalSessions = this.stats.timeAndSession.numberOfSessions;
        this.stats.timeAndSession.averageSessionLength = 
            Math.round(this.stats.timeAndSession.totalPlaytime / totalSessions);
    }
    
    updateLocationTime(isUnderground, deltaTime) {
        if (isUnderground) {
            this.stats.timeAndSession.timeUnderground += deltaTime;
        } else {
            this.stats.timeAndSession.timeSurface += deltaTime;
        }
    }
    
    updateSurvivalStats(type, amount = 0, depth = 0) {
        switch(type) {
            case 'death':
                this.stats.survival.totalDeaths++;
                this.stats.survival.deathsByDepth.push(depth);
                if (depth > this.stats.survival.deepestDeath) {
                    this.stats.survival.deepestDeath = depth;
                }
                this.stats.survival.currentSurvivalStreak = 0;
                break;
            case 'enemyDamage':
                this.stats.survival.damageFromEnemies += amount;
                this.stats.survival.totalDamageTaken += amount;
                break;
            case 'fallDamage':
                this.stats.survival.damageFromFalls += amount;
                this.stats.survival.totalDamageTaken += amount;
                break;
            case 'energyConsumed':
                this.stats.survival.energyConsumed += amount;
                break;
            case 'energyPurchased':
                this.stats.survival.energyPurchased += amount;
                break;
            case 'lowHealth':
                if (amount < this.stats.survival.closestCall && amount > 0) {
                    this.stats.survival.closestCall = amount;
                }
                break;
        }
        
        this.checkAutoSave();
    }
    
    updateSurvivalStreak(deltaTime) {
        this.stats.survival.currentSurvivalStreak += deltaTime;
        if (this.stats.survival.currentSurvivalStreak > this.stats.survival.longestSurvivalStreak) {
            this.stats.survival.longestSurvivalStreak = this.stats.survival.currentSurvivalStreak;
        }
    }
    
    updateNetWorth(cash, inventoryValue) {
        this.stats.economic.currentNetWorth = cash + inventoryValue;
    }
    
    onSessionStart() {
        this.sessionStartTime = Date.now();
        this.stats.timeAndSession.numberOfSessions++;
    }
    
    onSessionEnd() {
        this.updateTimeStats();
        this.save();
    }
    
    // Save/Load methods
    checkAutoSave() {
        const now = Date.now();
        if (now - this.lastSaveTime > this.autoSaveInterval) {
            this.save();
            this.lastSaveTime = now;
        }
    }
    
    save() {
        try {
            localStorage.setItem('minerStats', JSON.stringify(this.stats));
        } catch (e) {
            console.error('Failed to save statistics:', e);
        }
    }
    
    loadStats() {
        try {
            const saved = localStorage.getItem('minerStats');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('Failed to load statistics:', e);
            return null;
        }
    }
    
    reset() {
        this.stats = this.getDefaultStats();
        this.sessionStartTime = Date.now();
        this.save();
    }
    
    // Utility methods
    getFormattedPlaytime() {
        // Include current session time in total playtime
        const currentSessionTime = Date.now() - this.sessionStartTime;
        const total = this.stats.timeAndSession.totalPlaytime + currentSessionTime;
        const hours = Math.floor(total / 3600000);
        const minutes = Math.floor((total % 3600000) / 60000);
        const seconds = Math.floor((total % 60000) / 1000);
        
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    
    getFormattedDistance() {
        const total = this.stats.mining.distanceTraveled.total;
        return `${Math.round(total / 32)}m`; // Convert pixels to meters
    }
    
    getDeathRate() {
        const deaths = this.stats.survival.totalDeaths;
        // Include current session time in total playtime
        const currentSessionTime = Date.now() - this.sessionStartTime;
        const totalTime = this.stats.timeAndSession.totalPlaytime + currentSessionTime;
        const hours = totalTime / 3600000;
        return hours > 0 ? (deaths / hours).toFixed(2) : '0.00';
    }
}