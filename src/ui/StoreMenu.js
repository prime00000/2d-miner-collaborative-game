import { RESOURCE_PRICES } from '../core/Constants.js';

export class StoreMenu {
    constructor(gameState) {
        this.gameState = gameState;
        this.isOpen = false;
        this.menuElement = null;
        this.createMenuElement();
    }
    
    createMenuElement() {
        // Create menu container
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'storeMenu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #8B4513;
            padding: 20px;
            color: white;
            font-family: Arial, sans-serif;
            display: none;
            z-index: 1000;
            min-width: 500px;
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
        const { resources, upgrades } = this.gameState;
        const energyPrice = RESOURCE_PRICES.energy;
        const pickaxePrice = RESOURCE_PRICES.improvedPickaxe;
        
        let html = `
            <h2 style="color: #FFD700; text-align: center; margin-bottom: 20px;">GENERAL STORE</h2>
            <p style="text-align: center; margin-bottom: 20px;">Your Cash: $${resources.cash}</p>
            
            <div style="margin-bottom: 30px;">
                <h3 style="color: #87CEEB; margin-bottom: 15px;">Energy Supplies</h3>
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 5px;">
                    <p style="margin-bottom: 10px;">
                        Current Energy: ${resources.energy}/${resources.maxEnergy}
                    </p>
                    <p style="margin-bottom: 15px;">
                        Price: $${energyPrice.toFixed(2)} per unit
                    </p>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        `;
        
        // Energy purchase buttons
        const energyAmounts = [100, 500, 1000];
        for (const amount of energyAmounts) {
            const cost = amount * energyPrice;
            const canAfford = resources.cash >= cost;
            const hasSpace = resources.energy + amount <= resources.maxEnergy;
            const disabled = !canAfford || !hasSpace;
            
            html += `
                <button 
                    onclick="window.storeMenu.buyEnergy(${amount})"
                    style="background: ${disabled ? '#555' : '#4CAF50'}; 
                           color: white; 
                           border: none; 
                           padding: 10px 20px; 
                           cursor: ${disabled ? 'not-allowed' : 'pointer'};
                           opacity: ${disabled ? '0.6' : '1'};"
                    onmouseover="if(!this.disabled) this.style.background='#45a049'"
                    onmouseout="if(!this.disabled) this.style.background='#4CAF50'"
                    ${disabled ? 'disabled' : ''}
                    title="${!canAfford ? 'Not enough cash' : !hasSpace ? 'Not enough energy capacity' : ''}"
                >
                    Buy ${amount} ($${cost.toFixed(0)})
                </button>
            `;
        }
        
        // Full refill button
        const energyNeeded = resources.maxEnergy - resources.energy;
        const fullRefillCost = energyNeeded * energyPrice;
        const canAffordFull = resources.cash >= fullRefillCost;
        const needsRefill = energyNeeded > 0;
        const fullDisabled = !canAffordFull || !needsRefill;
        
        html += `
                <button 
                    onclick="window.storeMenu.buyFullEnergy()"
                    style="background: ${fullDisabled ? '#555' : '#2196F3'}; 
                           color: white; 
                           border: none; 
                           padding: 10px 20px; 
                           cursor: ${fullDisabled ? 'not-allowed' : 'pointer'};
                           opacity: ${fullDisabled ? '0.6' : '1'};"
                    onmouseover="if(!this.disabled) this.style.background='#1976D2'"
                    onmouseout="if(!this.disabled) this.style.background='#2196F3'"
                    ${fullDisabled ? 'disabled' : ''}
                    title="${!canAffordFull ? 'Not enough cash' : !needsRefill ? 'Energy already full' : ''}"
                >
                    FULL REFILL ($${fullRefillCost.toFixed(0)})
                </button>
            `;
        
        html += `
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h3 style="color: #87CEEB; margin-bottom: 15px;">Equipment Upgrades</h3>
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 5px;">
        `;
        
        // Improved Pickaxe
        if (!upgrades.improvedPickaxe) {
            const canAfford = resources.cash >= pickaxePrice;
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #FFD700; margin-bottom: 5px;">Improved Pickaxe</h4>
                    <p style="color: #CCC; margin-bottom: 10px;">
                        Reduces energy consumption by 10% when mining
                    </p>
                    <p style="margin-bottom: 10px;">
                        Price: $${pickaxePrice}
                    </p>
                    <button 
                        onclick="window.storeMenu.buyPickaxe()"
                        style="background: ${canAfford ? '#FF6B6B' : '#555'}; 
                               color: white; 
                               border: none; 
                               padding: 10px 30px; 
                               cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                               opacity: ${canAfford ? '1' : '0.6'};"
                        onmouseover="if(!this.disabled) this.style.background='#FF5252'"
                        onmouseout="if(!this.disabled) this.style.background='#FF6B6B'"
                        ${canAfford ? '' : 'disabled'}
                        title="${canAfford ? '' : 'Not enough cash'}"
                    >
                        Purchase ($${pickaxePrice})
                    </button>
                </div>
            `;
        } else {
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #4CAF50; margin-bottom: 5px;">✓ Improved Pickaxe</h4>
                    <p style="color: #888;">Already purchased - 10% energy reduction active</p>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button 
                    onclick="window.storeMenu.close()"
                    style="background: #666; color: white; border: none; padding: 10px 30px; cursor: pointer; font-size: 16px;"
                    onmouseover="this.style.background='#555'"
                    onmouseout="this.style.background='#666'"
                >CLOSE</button>
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
        window.storeMenu = this;
    }
    
    close() {
        this.isOpen = false;
        this.menuElement.style.display = 'none';
    }
    
    buyEnergy(amount) {
        const cost = amount * RESOURCE_PRICES.energy;
        const { resources } = this.gameState;
        
        if (resources.cash >= cost && resources.energy + amount <= resources.maxEnergy) {
            resources.cash -= cost;
            resources.energy = Math.min(resources.energy + amount, resources.maxEnergy);
            this.updateMenuContent();
            this.gameState.save();
        }
    }
    
    buyFullEnergy() {
        const { resources } = this.gameState;
        const energyNeeded = resources.maxEnergy - resources.energy;
        const cost = energyNeeded * RESOURCE_PRICES.energy;
        
        if (resources.cash >= cost && energyNeeded > 0) {
            resources.cash -= cost;
            resources.energy = resources.maxEnergy;
            this.updateMenuContent();
            this.gameState.save();
        }
    }
    
    buyPickaxe() {
        const cost = RESOURCE_PRICES.improvedPickaxe;
        const { resources, upgrades } = this.gameState;
        
        if (resources.cash >= cost && !upgrades.improvedPickaxe) {
            resources.cash -= cost;
            upgrades.improvedPickaxe = true;
            this.updateMenuContent();
            this.gameState.save();
        }
    }
}