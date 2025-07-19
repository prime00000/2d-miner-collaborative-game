import { RESOURCE_PRICES } from '../core/Constants.js';

export class AssayerMenu {
    constructor(gameState) {
        this.gameState = gameState;
        this.isOpen = false;
        this.selectedOre = null;
        this.menuElement = null;
        this.createMenuElement();
    }
    
    createMenuElement() {
        // Create menu container
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'assayerMenu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #800080;
            padding: 20px;
            color: white;
            font-family: Arial, sans-serif;
            display: none;
            z-index: 1000;
            min-width: 400px;
        `;
        
        // Create menu content
        this.updateMenuContent();
        
        // Add to document
        document.body.appendChild(this.menuElement);
        
        // Add keyboard listener for closing
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    updateMenuContent() {
        const inventory = this.gameState.inventory;
        const hasPocketRefinery = this.gameState.upgrades.pocketRefinery;
        const priceMultiplier = hasPocketRefinery ? 1.2 : 1.0;
        const marketManager = this.gameState.marketManager;
        const marketSummary = marketManager ? marketManager.getMarketSummary() : null;
        
        let html = `
            <h2 style="color: #FFD700; text-align: center; margin-bottom: 20px;">ASSAYER'S OFFICE</h2>
            <p style="text-align: center; margin-bottom: 20px;">
                Current Market Prices
                ${hasPocketRefinery ? '<br><span style="color: #4CAF50; font-size: 14px;">✓ Pocket Refinery: +20% prices</span>' : ''}
            </p>
        `;
        
        // Show active market event if any
        if (marketSummary && marketSummary.activeEvent) {
            html += `
                <div style="background: rgba(138, 43, 226, 0.3); border: 2px solid #8A2BE2; padding: 10px; margin-bottom: 20px; text-align: center;">
                    <span style="font-size: 20px;">${marketSummary.activeEvent.icon}</span>
                    <strong style="color: #E6E6FA;">${marketSummary.activeEvent.name}!</strong>
                    ${marketSummary.activeEvent.description}
                    <span style="color: #FFD700;">(${marketSummary.eventTimeRemaining}s remaining)</span>
                </div>
            `;
        }
        
        html += `
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #666;">
                    <th style="text-align: left; padding: 10px;">Ore Type</th>
                    <th style="text-align: center; padding: 10px;">Market Price</th>
                    <th style="text-align: center; padding: 10px;">Trend</th>
                    <th style="text-align: center; padding: 10px;">You Have</th>
                    <th style="text-align: center; padding: 10px;">Total Value</th>
                    <th style="text-align: center; padding: 10px;">Action</th>
                </tr>
        `;
        
        const ores = [
            { key: 'iron', name: 'Iron Ore', color: '#525252' },
            { key: 'copper', name: 'Copper Ore', color: '#B87333' },
            { key: 'silver', name: 'Silver Ore', color: '#C0C0C0' },
            { key: 'gold', name: 'Gold Ore', color: '#FFD700' }
        ];
        
        for (const ore of ores) {
            const quantity = inventory[ore.key] || 0;
            
            // Get dynamic market price
            let basePrice, marketPrice;
            if (marketManager) {
                marketPrice = marketManager.getPrice(ore.key, quantity);
                basePrice = marketManager.basePrices[ore.key];
            } else {
                // Fallback to static prices
                basePrice = RESOURCE_PRICES[ore.key];
                marketPrice = basePrice;
            }
            
            const price = Math.floor(marketPrice * priceMultiplier);
            const totalValue = quantity * price;
            
            // Get trend info
            let trendArrow = '';
            let trendColor = '#FFFFFF';
            let changePercent = '';
            if (marketManager) {
                trendArrow = marketManager.getTrendArrow(ore.key);
                trendColor = marketManager.getTrendColor(ore.key);
                const percentChange = marketManager.getPriceChangePercent(ore.key);
                changePercent = percentChange >= 0 ? `+${percentChange}%` : `${percentChange}%`;
            }
            
            html += `
                <tr>
                    <td style="padding: 10px; color: ${ore.color};">${ore.name}</td>
                    <td style="text-align: center; padding: 10px;">
                        $${marketPrice}
                        ${quantity >= 10 ? '<br><small style="color: #4CAF50;">+5% bulk</small>' : ''}
                        ${hasPocketRefinery ? '<br><small style="color: #4CAF50;">+20% refinery</small>' : ''}
                    </td>
                    <td style="text-align: center; padding: 10px;">
                        <span style="color: ${trendColor}; font-size: 20px;">${trendArrow}</span>
                        <br>
                        <small style="color: ${trendColor};">${changePercent}</small>
                    </td>
                    <td style="text-align: center; padding: 10px;">${quantity}</td>
                    <td style="text-align: center; padding: 10px;">$${totalValue}</td>
                    <td style="text-align: center; padding: 10px;">
            `;
            
            if (quantity > 0) {
                html += `<button 
                    onclick="window.assayerMenu.sellOre('${ore.key}')"
                    style="background: #4CAF50; color: white; border: none; padding: 5px 15px; cursor: pointer;"
                    onmouseover="this.style.background='#45a049'"
                    onmouseout="this.style.background='#4CAF50'"
                >SELL</button>`;
            } else {
                html += `<span style="color: #666;">None</span>`;
            }
            
            html += `</td></tr>`;
        }
        
        // Calculate total inventory value
        const totalInventoryValue = ores.reduce((sum, ore) => {
            const quantity = inventory[ore.key] || 0;
            let marketPrice;
            if (marketManager) {
                marketPrice = marketManager.getPrice(ore.key, quantity);
            } else {
                marketPrice = RESOURCE_PRICES[ore.key];
            }
            const price = Math.floor(marketPrice * priceMultiplier);
            return sum + quantity * price;
        }, 0);
        
        html += `
            </table>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #666;">
                <p style="text-align: center; font-size: 18px; color: #FFD700;">
                    Total Inventory Value: $${totalInventoryValue}
                </p>
                <div style="text-align: center; margin-top: 20px;">
                    <button 
                        onclick="window.assayerMenu.sellAll()"
                        style="background: #FF6B6B; color: white; border: none; padding: 10px 30px; cursor: pointer; margin-right: 10px; font-size: 16px;"
                        onmouseover="this.style.background='#FF5252'"
                        onmouseout="this.style.background='#FF6B6B'"
                        ${totalInventoryValue === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                    >SELL ALL</button>
                    <button 
                        onclick="window.assayerMenu.close()"
                        style="background: #666; color: white; border: none; padding: 10px 30px; cursor: pointer; font-size: 16px;"
                        onmouseover="this.style.background='#555'"
                        onmouseout="this.style.background='#666'"
                    >CLOSE</button>
                </div>
            </div>
            <p style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
                Press ESC to close
            </p>
        `;
        
        this.menuElement.innerHTML = html;
    }
    
    open() {
        this.isOpen = true;
        this.updateMenuContent();
        this.menuElement.style.display = 'block';
        
        // Store reference for onclick handlers
        window.assayerMenu = this;
    }
    
    close() {
        this.isOpen = false;
        this.menuElement.style.display = 'none';
    }
    
    sellOre(oreType) {
        const quantity = this.gameState.inventory[oreType];
        const marketManager = this.gameState.marketManager;
        
        let marketPrice;
        if (marketManager) {
            marketPrice = marketManager.getPrice(oreType, quantity);
        } else {
            marketPrice = RESOURCE_PRICES[oreType];
        }
        
        const priceMultiplier = this.gameState.upgrades.pocketRefinery ? 1.2 : 1.0;
        const price = Math.floor(marketPrice * priceMultiplier);
        const totalValue = quantity * price;
        
        if (quantity > 0) {
            // Add cash
            this.gameState.resources.cash += totalValue;
            
            // Track money earned for achievements and statistics
            this.gameState.stats.totalMoneyEarned += totalValue;
            if (this.gameState.statistics) {
                this.gameState.statistics.updateEconomicStats('earned', totalValue);
                this.gameState.statistics.updateEconomicStats('sale', totalValue, oreType);
                this.gameState.statistics.updateOresSold(quantity);
            }
            
            // Remove from inventory
            this.gameState.inventory[oreType] = 0;
            
            // Update menu
            this.updateMenuContent();
            
            // Save game
            this.gameState.save();
        }
    }
    
    sellAll() {
        const ores = ['iron', 'copper', 'silver', 'gold'];
        let totalEarned = 0;
        const priceMultiplier = this.gameState.upgrades.pocketRefinery ? 1.2 : 1.0;
        
        // Store ore quantities before clearing
        const oreQuantities = {};
        for (const ore of ores) {
            oreQuantities[ore] = this.gameState.inventory[ore] || 0;
        }
        
        // Calculate total and clear inventory
        const marketManager = this.gameState.marketManager;
        for (const ore of ores) {
            const quantity = oreQuantities[ore];
            if (quantity > 0) {
                let marketPrice;
                if (marketManager) {
                    marketPrice = marketManager.getPrice(ore, quantity);
                } else {
                    marketPrice = RESOURCE_PRICES[ore];
                }
                const price = Math.floor(marketPrice * priceMultiplier);
                totalEarned += quantity * price;
                this.gameState.inventory[ore] = 0;
            }
        }
        
        if (totalEarned > 0) {
            this.gameState.resources.cash += totalEarned;
            
            // Track money earned for achievements and statistics
            this.gameState.stats.totalMoneyEarned += totalEarned;
            if (this.gameState.statistics) {
                this.gameState.statistics.updateEconomicStats('earned', totalEarned);
                // Also track individual ore sales using stored quantities
                for (const ore of ores) {
                    const quantity = oreQuantities[ore];
                    if (quantity > 0) {
                        let marketPrice;
                        if (marketManager) {
                            marketPrice = marketManager.getPrice(ore, quantity);
                        } else {
                            marketPrice = RESOURCE_PRICES[ore];
                        }
                        const price = Math.floor(marketPrice * priceMultiplier);
                        const oreValue = quantity * price;
                        this.gameState.statistics.updateEconomicStats('sale', oreValue, ore);
                        this.gameState.statistics.updateOresSold(quantity);
                    }
                }
            }
            
            this.updateMenuContent();
            this.gameState.save();
        }
    }
}