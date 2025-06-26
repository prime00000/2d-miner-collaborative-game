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
        
        let html = `
            <h2 style="color: #FFD700; text-align: center; margin-bottom: 20px;">ASSAYER'S OFFICE</h2>
            <p style="text-align: center; margin-bottom: 20px;">Current Market Prices</p>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #666;">
                    <th style="text-align: left; padding: 10px;">Ore Type</th>
                    <th style="text-align: center; padding: 10px;">Price/Unit</th>
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
            const price = RESOURCE_PRICES[ore.key];
            const totalValue = quantity * price;
            
            html += `
                <tr>
                    <td style="padding: 10px; color: ${ore.color};">${ore.name}</td>
                    <td style="text-align: center; padding: 10px;">$${price}</td>
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
            return sum + (inventory[ore.key] || 0) * RESOURCE_PRICES[ore.key];
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
        const price = RESOURCE_PRICES[oreType];
        const totalValue = quantity * price;
        
        if (quantity > 0) {
            // Add cash
            this.gameState.resources.cash += totalValue;
            
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
        
        for (const ore of ores) {
            const quantity = this.gameState.inventory[ore];
            if (quantity > 0) {
                const price = RESOURCE_PRICES[ore];
                totalEarned += quantity * price;
                this.gameState.inventory[ore] = 0;
            }
        }
        
        if (totalEarned > 0) {
            this.gameState.resources.cash += totalEarned;
            this.updateMenuContent();
            this.gameState.save();
        }
    }
}