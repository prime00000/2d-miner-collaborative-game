export class MarketManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Base prices
        this.basePrices = {
            iron: 10,
            copper: 20,
            silver: 40,
            gold: 100
        };
        
        // Fluctuation ranges (as percentages)
        this.fluctuationRanges = {
            iron: 0.3,    // ±30%
            copper: 0.4,  // ±40%
            silver: 0.5,  // ±50%
            gold: 0.6     // ±60%
        };
        
        // Current market state
        this.currentPrices = { ...this.basePrices };
        this.previousPrices = { ...this.basePrices };
        this.priceHistory = {
            iron: [this.basePrices.iron],
            copper: [this.basePrices.copper],
            silver: [this.basePrices.silver],
            gold: [this.basePrices.gold]
        };
        
        // Price momentum (for random walk with momentum)
        this.momentum = {
            iron: 0,
            copper: 0,
            silver: 0,
            gold: 0
        };
        
        // Market event system
        this.activeEvent = null;
        this.eventTimeRemaining = 0;
        this.marketEvents = [
            {
                name: "Gold Rush",
                icon: "⛏️",
                description: "Gold prices surge!",
                duration: 90000, // 90 seconds
                effects: { gold: 1.5 } // 150% of normal
            },
            {
                name: "Iron Shortage", 
                icon: "🏗️",
                description: "Iron in high demand!",
                duration: 90000, // 90 seconds
                effects: { iron: 1.8 } // 180% of normal
            },
            {
                name: "Market Crash",
                icon: "📉",
                description: "All prices plummet!",
                duration: 90000, // 90 seconds
                effects: { 
                    iron: 0.7,
                    copper: 0.6,
                    silver: 0.5,
                    gold: 0.5
                }
            },
            {
                name: "Copper Boom",
                icon: "⚡",
                description: "Copper prices double!",
                duration: 90000, // 90 seconds
                effects: { copper: 2.0 }
            }
        ];
        
        // Update timer
        this.lastUpdate = Date.now();
        this.updateInterval = 5000; // 5 seconds
        
        // Notification queue
        this.notifications = [];
        
        // Start the market
        this.running = true;
    }
    
    update(deltaTime) {
        if (!this.running) return;
        
        // Update market event timer
        if (this.activeEvent && this.eventTimeRemaining > 0) {
            this.eventTimeRemaining -= deltaTime * 1000;
            if (this.eventTimeRemaining <= 0) {
                this.endMarketEvent();
            }
        }
        
        // Check if it's time for a price update
        const now = Date.now();
        if (now - this.lastUpdate >= this.updateInterval) {
            this.updatePrices();
            this.lastUpdate = now;
            
            // Check for random market events (2% chance)
            if (!this.activeEvent && Math.random() < 0.02) {
                this.triggerRandomEvent();
            }
        }
    }
    
    updatePrices() {
        // Store previous prices for comparison
        this.previousPrices = { ...this.currentPrices };
        
        // Update each ore price
        for (const ore of ['iron', 'copper', 'silver', 'gold']) {
            const basePrice = this.basePrices[ore];
            const range = this.fluctuationRanges[ore];
            
            // Random walk with momentum
            const randomChange = (Math.random() - 0.5) * 0.1; // ±5% random
            this.momentum[ore] = this.momentum[ore] * 0.7 + randomChange; // 70% momentum retention
            
            // Mean reversion force (pulls back to base price)
            const currentRatio = this.currentPrices[ore] / basePrice;
            const meanReversion = (1 - currentRatio) * 0.1; // 10% pull back to base
            
            // Combine forces
            const totalChange = this.momentum[ore] + meanReversion;
            
            // Apply change
            let newPrice = this.currentPrices[ore] * (1 + totalChange);
            
            // Apply hard limits (50% to 200% of base)
            const minPrice = basePrice * 0.5;
            const maxPrice = basePrice * 2.0;
            newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
            
            // Apply market event effects
            if (this.activeEvent && this.activeEvent.effects[ore]) {
                newPrice = basePrice * this.activeEvent.effects[ore];
            }
            
            // Round to nearest dollar
            this.currentPrices[ore] = Math.round(newPrice);
            
            // Update price history (keep last 10 prices)
            this.priceHistory[ore].push(this.currentPrices[ore]);
            if (this.priceHistory[ore].length > 10) {
                this.priceHistory[ore].shift();
            }
        }
    }
    
    triggerRandomEvent() {
        const event = this.marketEvents[Math.floor(Math.random() * this.marketEvents.length)];
        this.activeEvent = { ...event };
        this.eventTimeRemaining = event.duration;
        
        // Add notification
        this.addNotification({
            type: 'event',
            icon: event.icon,
            title: event.name,
            message: event.description,
            duration: 5000
        });
        
        // Immediately update prices to reflect event
        this.updatePrices();
    }
    
    endMarketEvent() {
        if (this.activeEvent) {
            this.addNotification({
                type: 'event_end',
                icon: '📊',
                title: `${this.activeEvent.name} Ended`,
                message: 'Market returns to normal',
                duration: 3000
            });
        }
        
        this.activeEvent = null;
        this.eventTimeRemaining = 0;
        
        // Update prices to remove event effects
        this.updatePrices();
    }
    
    getPrice(ore, quantity = 1) {
        const basePrice = this.currentPrices[ore] || this.basePrices[ore];
        
        // Apply bulk bonus for 10+ units
        if (quantity >= 10) {
            return Math.round(basePrice * 1.05); // 5% bonus
        }
        
        return basePrice;
    }
    
    getTotalValue(ore, quantity) {
        const pricePerUnit = this.getPrice(ore, quantity);
        return pricePerUnit * quantity;
    }
    
    getPriceTrend(ore) {
        const current = this.currentPrices[ore];
        const previous = this.previousPrices[ore];
        
        if (current > previous) return 'up';
        if (current < previous) return 'down';
        return 'stable';
    }
    
    getPriceChangePercent(ore) {
        const current = this.currentPrices[ore];
        const base = this.basePrices[ore];
        const change = ((current - base) / base) * 100;
        return Math.round(change);
    }
    
    getTrendArrow(ore) {
        const trend = this.getPriceTrend(ore);
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '→';
    }
    
    getTrendColor(ore) {
        const trend = this.getPriceTrend(ore);
        if (trend === 'up') return '#00FF00';
        if (trend === 'down') return '#FF0000';
        return '#FFFF00';
    }
    
    addNotification(notification) {
        notification.id = Date.now();
        notification.startTime = Date.now();
        this.notifications.push(notification);
    }
    
    getActiveNotifications() {
        const now = Date.now();
        // Filter out expired notifications
        this.notifications = this.notifications.filter(n => 
            now - n.startTime < n.duration
        );
        return this.notifications;
    }
    
    getMarketSummary() {
        return {
            prices: this.currentPrices,
            trends: {
                iron: this.getPriceTrend('iron'),
                copper: this.getPriceTrend('copper'),
                silver: this.getPriceTrend('silver'),
                gold: this.getPriceTrend('gold')
            },
            changes: {
                iron: this.getPriceChangePercent('iron'),
                copper: this.getPriceChangePercent('copper'),
                silver: this.getPriceChangePercent('silver'),
                gold: this.getPriceChangePercent('gold')
            },
            activeEvent: this.activeEvent,
            eventTimeRemaining: Math.ceil(this.eventTimeRemaining / 1000) // in seconds
        };
    }
    
    stop() {
        this.running = false;
    }
    
    start() {
        this.running = true;
        this.lastUpdate = Date.now();
    }
}