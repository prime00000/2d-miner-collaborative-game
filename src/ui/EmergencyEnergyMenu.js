import { RESOURCE_PRICES } from '../core/Constants.js';

export class EmergencyEnergyMenu {
    constructor(gameState) {
        this.gameState = gameState;
        this.isOpen = false;
        this.hasShownThisSession = false; // Prevent spam
        this.menuElement = null;
        this.createMenuElement();
    }
    
    createMenuElement() {
        // Create menu container
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'emergencyEnergyMenu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            background: rgba(0, 0, 0, 0.85);
            border: 2px solid #FF0000;
            padding: 10px;
            color: white;
            font-family: Arial, sans-serif;
            display: none;
            z-index: 1500;
            width: 200px;
            box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
        `;
        
        // Add to document
        document.body.appendChild(this.menuElement);
    }
    
    updateMenuContent() {
        const { resources } = this.gameState;
        const trollPrice = RESOURCE_PRICES.energy * 10; // 10x normal price
        const minPurchase = 100; // Minimum 100 energy units
        const totalCost = minPurchase * trollPrice;
        const canAfford = resources.cash >= totalCost;
        
        let html = `
            <h3 style="color: #FF0000; text-align: center; margin: 0 0 10px 0; font-size: 14px;">
                ⚠️ LOW ENERGY ⚠️
            </h3>
            
            <p style="text-align: center; margin: 0 0 10px 0; font-size: 12px; color: #FFD700;">
                Energy: <span style="color: #FF6B6B; font-weight: bold;">${resources.energy}</span> / ${resources.maxEnergy}
            </p>
            
            <!-- Troll Purchase Option -->
            <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 3px; margin-bottom: 8px;">
                <p style="margin: 0 0 5px 0; font-size: 11px; color: #FFD700; text-align: center;">
                    Emergency Energy: $${totalCost}
                </p>
                <button 
                    onclick="window.emergencyEnergyMenu.buyFromTrolls()"
                    style="background: ${canAfford ? '#9370DB' : '#555'}; 
                           color: white; 
                           border: none; 
                           padding: 6px 12px; 
                           cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                           font-size: 12px;
                           width: 100%;
                           opacity: ${canAfford ? '1' : '0.6'};"
                    ${canAfford ? '' : 'disabled'}
                >
                    ${canAfford ? 'BUY 100 ENERGY' : 'INSUFFICIENT FUNDS'}
                </button>
            </div>
            
            <!-- Rescue Option -->
            <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 3px;">
                <p style="margin: 0 0 5px 0; font-size: 11px; color: #FFA500; text-align: center;">
                    Get Rescued (lose all ores)
                </p>
                <button 
                    onclick="window.emergencyEnergyMenu.getRescued()"
                    style="background: #FF6B6B; 
                           color: white; 
                           border: none; 
                           padding: 6px 12px; 
                           cursor: pointer;
                           font-size: 12px;
                           width: 100%;">
                    CALL RESCUE
                </button>
            </div>
        `;
        
        this.menuElement.innerHTML = html;
    }
    
    checkAndShow() {
        const { resources, player } = this.gameState;
        
        // Show whenever underground and low on energy
        if (player.isUnderground && resources.energy < 100) {
            if (!this.isOpen) {
                this.open();
            }
        } else {
            // Hide when not underground or energy is above 100
            if (this.isOpen) {
                this.close();
            }
        }
    }
    
    open() {
        this.isOpen = true;
        this.updateMenuContent();
        this.menuElement.style.display = 'block';
        
        // Store reference for onclick handlers
        window.emergencyEnergyMenu = this;
    }
    
    close() {
        this.isOpen = false;
        this.menuElement.style.display = 'none';
    }
    
    buyFromTrolls() {
        const { resources } = this.gameState;
        const trollPrice = RESOURCE_PRICES.energy * 10;
        const minPurchase = 100;
        const totalCost = minPurchase * trollPrice;
        
        if (resources.cash >= totalCost) {
            resources.cash -= totalCost;
            resources.energy = Math.min(resources.energy + minPurchase, resources.maxEnergy);
            // Don't close the menu - it will hide automatically when energy > 100
            this.gameState.save();
            
            // Show confirmation message through player
            if (this.gameState.playerRef) {
                this.gameState.playerRef.miningMessage = `Purchased ${minPurchase} energy from the trolls for $${totalCost}!`;
                this.gameState.playerRef.miningMessageTime = 3000;
                this.gameState.playerRef.miningMessageType = 'regular';
            }
        }
    }
    
    getRescued() {
        const { inventory } = this.gameState;
        
        // Clear all ores
        inventory.iron = 0;
        inventory.copper = 0;
        inventory.silver = 0;
        inventory.gold = 0;
        
        // Return to surface
        this.gameState.returnToSurface();
        
        // Give a small energy boost to get to safety
        this.gameState.resources.energy = Math.min(this.gameState.resources.energy + 50, this.gameState.resources.maxEnergy);
        
        // Don't close the menu - it will hide automatically when energy > 100
        this.gameState.save();
        
        // Show rescue message
        if (this.gameState.playerRef) {
            this.gameState.playerRef.miningMessage = "Rescued! You lost all your ores but made it to safety.";
            this.gameState.playerRef.miningMessageTime = 4000;
            this.gameState.playerRef.miningMessageType = 'regular';
        }
    }
}