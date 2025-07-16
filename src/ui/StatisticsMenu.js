export class StatisticsMenu {
    constructor(gameState) {
        this.gameState = gameState;
        this.statistics = gameState.statistics;
        this.isOpen = false;
        this.menuElement = null;
        this.tabKeyPressed = false;
        this.createMenuElement();
        this.setupKeyboardListener();
    }
    
    createMenuElement() {
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'statisticsMenu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 3px solid #FFD700;
            padding: 20px;
            color: white;
            font-family: Arial, sans-serif;
            display: none;
            z-index: 1000;
            width: 800px;
            max-width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        document.body.appendChild(this.menuElement);
    }
    
    setupKeyboardListener() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !this.tabKeyPressed) {
                e.preventDefault();
                this.tabKeyPressed = true;
                this.toggle();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Tab') {
                this.tabKeyPressed = false;
            }
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.isOpen = true;
        this.updateContent();
        this.menuElement.style.display = 'block';
        
        // Pause the game
        if (this.gameState.game) {
            this.gameState.game.pause();
        }
    }
    
    close() {
        this.isOpen = false;
        this.menuElement.style.display = 'none';
        
        // Resume the game
        if (this.gameState.game) {
            this.gameState.game.resume();
        }
    }
    
    updateContent() {
        const stats = this.statistics.stats;
        
        let html = `
            <h2 style="color: #FFD700; text-align: center; margin-bottom: 20px;">
                📊 PLAYER STATISTICS 📊
            </h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        `;
        
        // Mining Stats
        html += this.createSection('⛏️ Mining Stats', [
            ['Total Tiles Mined', stats.mining.totalTilesMined.toLocaleString()],
            ['Perfect Digs (Found Ore)', stats.mining.perfectDigs.toLocaleString()],
            ['Empty Digs', stats.mining.emptyDigs.toLocaleString()],
            ['Mining Efficiency', `${stats.mining.miningEfficiency}%`],
            ['Deepest Point Reached', `${stats.mining.deepestPointReached}m`],
            ['Distance Traveled', this.statistics.getFormattedDistance()],
            ['Dirt Mined', stats.mining.tilesMinedByType.dirt.toLocaleString()],
            ['Clay Mined', stats.mining.tilesMinedByType.clay.toLocaleString()],
            ['Stone Mined', stats.mining.tilesMinedByType.stone.toLocaleString()]
        ]);
        
        // Economic Stats
        html += this.createSection('💰 Economic Stats', [
            ['Total Money Earned', `$${stats.economic.totalMoneyEarned.toLocaleString()}`],
            ['Money Spent at Store', `$${stats.economic.moneySpentAtStore.toLocaleString()}`],
            ['Money Lost to Death', `$${stats.economic.moneyLostToDeath.toLocaleString()}`],
            ['Best Single Transaction', `$${stats.economic.bestSingleTransaction.toLocaleString()}`],
            ['Current Net Worth', `$${stats.economic.currentNetWorth.toLocaleString()}`],
            ['Most Profitable Ore', stats.economic.mostProfitableOreType || 'None'],
            ['Average Ore Sale Price', `$${stats.economic.averageOreSalePrice.toFixed(2)}`]
        ]);
        
        // Ore Collection Stats
        html += this.createSection('💎 Ore Collection', [
            ['Total Ores Collected', stats.oreCollection.totalOresCollected.toLocaleString()],
            ['Iron Collected', stats.oreCollection.oresByType.iron.toLocaleString()],
            ['Copper Collected', stats.oreCollection.oresByType.copper.toLocaleString()],
            ['Silver Collected', stats.oreCollection.oresByType.silver.toLocaleString()],
            ['Gold Collected', stats.oreCollection.oresByType.gold.toLocaleString()],
            ['Ores Sold', stats.oreCollection.oresSold.toLocaleString()],
            ['Largest Ore Haul', stats.oreCollection.largestOreHaul.toLocaleString()],
            ['Rarest Ore Found', stats.oreCollection.rarestOreFound || 'None'],
            ['Current Inventory Value', `$${stats.oreCollection.currentInventoryValue.toLocaleString()}`]
        ]);
        
        // Time & Session Stats
        html += this.createSection('⏱️ Time & Sessions', [
            ['Total Playtime', this.statistics.getFormattedPlaytime()],
            ['Current Session', this.formatTime(stats.timeAndSession.currentSessionLength)],
            ['Average Session', this.formatTime(stats.timeAndSession.averageSessionLength)],
            ['Longest Session', this.formatTime(stats.timeAndSession.longestSession)],
            ['Number of Sessions', stats.timeAndSession.numberOfSessions.toLocaleString()],
            ['Time Underground', this.formatTime(stats.timeAndSession.timeUnderground)],
            ['Time on Surface', this.formatTime(stats.timeAndSession.timeSurface)],
            ['First Played', new Date(stats.timeAndSession.firstPlayDate).toLocaleDateString()]
        ]);
        
        // Survival Stats
        html += this.createSection('💀 Survival Stats', [
            ['Total Deaths', stats.survival.totalDeaths.toLocaleString()],
            ['Deepest Death', `${stats.survival.deepestDeath}m`],
            ['Enemy Damage Taken', stats.survival.damageFromEnemies.toLocaleString()],
            ['Fall Damage Taken', stats.survival.damageFromFalls.toLocaleString()],
            ['Total Damage Taken', stats.survival.totalDamageTaken.toLocaleString()],
            ['Energy Consumed', stats.survival.energyConsumed.toLocaleString()],
            ['Energy Purchased', stats.survival.energyPurchased.toLocaleString()],
            ['Closest Call (Lowest HP)', `${stats.survival.closestCall} HP`],
            ['Death Rate', `${this.statistics.getDeathRate()} per hour`]
        ]);
        
        // Achievement Stats
        html += this.createSection('🏆 Achievement Progress', [
            ['Lucky Strikes (10+ ores)', stats.achievements.luckyStrikes.toLocaleString()],
            ['Best Perfect Dig Streak', stats.achievements.consecutivePerfectDigs.toLocaleString()],
            ['Deep Dives to 45m', stats.achievements.deepDivesTo45m.toLocaleString()],
            ['Reached 20m', stats.achievements.hasReachedDepth[20] ? '✓' : '✗'],
            ['Reached 50m', stats.achievements.hasReachedDepth[50] ? '✓' : '✗'],
            ['Reached 100m', stats.achievements.hasReachedDepth[100] ? '✓' : '✗'],
            ['Reached 200m', stats.achievements.hasReachedDepth[200] ? '✓' : '✗'],
            ['Survived to 90m', stats.achievements.survivedTo90m ? '✓' : '✗']
        ]);
        
        html += `
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <p style="color: #888;">Press TAB to close</p>
                <button 
                    onclick="window.statisticsMenu.resetStats()"
                    style="background: #FF4444; 
                           color: white; 
                           border: none; 
                           padding: 10px 20px; 
                           margin-top: 10px;
                           cursor: pointer;"
                    onmouseover="this.style.background='#CC0000'"
                    onmouseout="this.style.background='#FF4444'"
                >
                    Reset All Statistics
                </button>
            </div>
        `;
        
        this.menuElement.innerHTML = html;
        
        // Make this menu accessible globally for the button
        window.statisticsMenu = this;
    }
    
    createSection(title, stats) {
        let html = `
            <div style="background: rgba(255, 255, 255, 0.05); 
                        padding: 15px; 
                        border-radius: 5px; 
                        margin-bottom: 15px;">
                <h3 style="color: #87CEEB; margin-bottom: 15px;">${title}</h3>
                <table style="width: 100%; border-collapse: collapse;">
        `;
        
        for (const [label, value] of stats) {
            html += `
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <td style="padding: 5px 0; color: #CCC;">${label}</td>
                    <td style="padding: 5px 0; color: #FFF; text-align: right; font-weight: bold;">
                        ${value}
                    </td>
                </tr>
            `;
        }
        
        html += `
                </table>
            </div>
        `;
        
        return html;
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    resetStats() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone!')) {
            this.statistics.reset();
            this.updateContent();
        }
    }
}