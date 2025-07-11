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
            max-height: 80vh;
            overflow-y: auto;
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
        
        // Iron Pickaxe
        const ironPickaxePrice = RESOURCE_PRICES.ironPickaxe;
        if (!upgrades.ironPickaxe) {
            const canAfford = resources.cash >= ironPickaxePrice;
            const hasPrereq = upgrades.improvedPickaxe;
            const canPurchase = canAfford && hasPrereq;
            
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #FFD700; margin-bottom: 5px;">Iron Pickaxe</h4>
                    <p style="color: #CCC; margin-bottom: 10px;">
                        Reduces energy consumption by 20% when mining<br>
                        <small style="color: ${hasPrereq ? '#999' : '#FF6B6B'};">Requires: Improved Pickaxe</small>
                    </p>
                    <p style="margin-bottom: 10px;">
                        Price: $${ironPickaxePrice.toLocaleString()}
                    </p>
                    <button 
                        onclick="window.storeMenu.buyIronPickaxe()"
                        style="background: ${canPurchase ? '#FF6B6B' : '#555'}; 
                               color: white; 
                               border: none; 
                               padding: 10px 30px; 
                               cursor: ${canPurchase ? 'pointer' : 'not-allowed'};
                               opacity: ${canPurchase ? '1' : '0.6'};"
                        onmouseover="if(!this.disabled) this.style.background='#FF5252'"
                        onmouseout="if(!this.disabled) this.style.background='#FF6B6B'"
                        ${canPurchase ? '' : 'disabled'}
                        title="${!canAfford ? 'Not enough cash' : !hasPrereq ? 'Requires Improved Pickaxe' : ''}"
                    >
                        Purchase ($${ironPickaxePrice.toLocaleString()})
                    </button>
                </div>
            `;
        } else {
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #4CAF50; margin-bottom: 5px;">✓ Iron Pickaxe</h4>
                    <p style="color: #888;">Already purchased - 20% energy reduction active</p>
                </div>
            `;
        }
        
        // Diamond Pickaxe
        const diamondPickaxePrice = RESOURCE_PRICES.diamondPickaxe;
        if (!upgrades.diamondPickaxe) {
            const canAfford = resources.cash >= diamondPickaxePrice;
            const hasPrereq = upgrades.ironPickaxe;
            const canPurchase = canAfford && hasPrereq;
            
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #FFD700; margin-bottom: 5px;">💎 Diamond Pickaxe</h4>
                    <p style="color: #CCC; margin-bottom: 10px;">
                        Reduces energy consumption by 50% when mining<br>
                        <small style="color: ${hasPrereq ? '#999' : '#FF6B6B'};">Requires: Iron Pickaxe</small>
                    </p>
                    <p style="margin-bottom: 10px;">
                        Price: $${diamondPickaxePrice.toLocaleString()}
                    </p>
                    <button 
                        onclick="window.storeMenu.buyDiamondPickaxe()"
                        style="background: ${canPurchase ? '#FF6B6B' : '#555'}; 
                               color: white; 
                               border: none; 
                               padding: 10px 30px; 
                               cursor: ${canPurchase ? 'pointer' : 'not-allowed'};
                               opacity: ${canPurchase ? '1' : '0.6'};"
                        onmouseover="if(!this.disabled) this.style.background='#FF5252'"
                        onmouseout="if(!this.disabled) this.style.background='#FF6B6B'"
                        ${canPurchase ? '' : 'disabled'}
                        title="${!canAfford ? 'Not enough cash' : !hasPrereq ? 'Requires Iron Pickaxe' : ''}"
                    >
                        Purchase ($${diamondPickaxePrice.toLocaleString()})
                    </button>
                </div>
            `;
        } else {
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #4CAF50; margin-bottom: 5px;">✓ 💎 Diamond Pickaxe</h4>
                    <p style="color: #888;">Already purchased - 50% energy reduction active</p>
                </div>
            `;
        }
        
        // Reinforced Boots
        const bootsPrice = RESOURCE_PRICES.reinforcedBoots;
        if (!upgrades.reinforcedBoots) {
            const canAfford = resources.cash >= bootsPrice;
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #FFD700; margin-bottom: 5px;">Reinforced Boots</h4>
                    <p style="color: #CCC; margin-bottom: 10px;">
                        Reduces fall damage by 50%<br>
                        <small style="color: #999;">Great for players who like to dig straight down</small>
                    </p>
                    <p style="margin-bottom: 10px;">
                        Price: $${bootsPrice}
                    </p>
                    <button 
                        onclick="window.storeMenu.buyBoots()"
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
                        Purchase ($${bootsPrice})
                    </button>
                </div>
            `;
        } else {
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #4CAF50; margin-bottom: 5px;">✓ Reinforced Boots</h4>
                    <p style="color: #888;">Already purchased - 50% fall damage reduction active</p>
                </div>
            `;
        }
        
        // Energy Pack
        const energyPackPrice = RESOURCE_PRICES.energyPack;
        if (!upgrades.energyPack) {
            const canAfford = resources.cash >= energyPackPrice;
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #FFD700; margin-bottom: 5px;">Energy Pack</h4>
                    <p style="color: #CCC; margin-bottom: 10px;">
                        Increases max energy capacity from 1000 to 1500<br>
                        <small style="color: #999;">Essential for deeper expeditions</small>
                    </p>
                    <p style="margin-bottom: 10px;">
                        Price: $${energyPackPrice}
                    </p>
                    <button 
                        onclick="window.storeMenu.buyEnergyPack()"
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
                        Purchase ($${energyPackPrice})
                    </button>
                </div>
            `;
        } else {
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #4CAF50; margin-bottom: 5px;">✓ Energy Pack</h4>
                    <p style="color: #888;">Already purchased - Max energy increased to 1500</p>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h3 style="color: #87CEEB; margin-bottom: 15px;">Consumables</h3>
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 5px;">
        `;
        
        // Energy Drinks
        const energyDrinkPrice = RESOURCE_PRICES.energyDrink;
        const canAffordDrink = resources.cash >= energyDrinkPrice;
        html += `
            <div style="margin-bottom: 15px;">
                <h4 style="color: #FFD700; margin-bottom: 5px;">Energy Drinks</h4>
                <p style="color: #CCC; margin-bottom: 10px;">
                    Instant +100 energy<br>
                    <small style="color: #999;">Can be used underground (portable energy)</small>
                </p>
                <p style="margin-bottom: 10px;">
                    Price: $${energyDrinkPrice} each | You have: ${this.gameState.consumables ? this.gameState.consumables.energyDrinks : 0}
                </p>
                <button 
                    onclick="window.storeMenu.buyEnergyDrink()"
                    style="background: ${canAffordDrink ? '#4CAF50' : '#555'}; 
                           color: white; 
                           border: none; 
                           padding: 10px 30px; 
                           cursor: ${canAffordDrink ? 'pointer' : 'not-allowed'};
                           opacity: ${canAffordDrink ? '1' : '0.6'};"
                    onmouseover="if(!this.disabled) this.style.background='#45a049'"
                    onmouseout="if(!this.disabled) this.style.background='#4CAF50'"
                    ${canAffordDrink ? '' : 'disabled'}
                    title="${canAffordDrink ? '' : 'Not enough cash'}"
                >
                    Buy 1 ($${energyDrinkPrice})
                </button>
            </div>
        `;
        
        // Lucky Charm
        const luckyCharmPrice = RESOURCE_PRICES.luckyCharm;
        const canAffordCharm = resources.cash >= luckyCharmPrice;
        const charmActive = this.gameState.buffs && this.gameState.buffs.luckyCharm && this.gameState.buffs.luckyCharm.active;
        html += `
            <div style="margin-bottom: 15px;">
                <h4 style="color: #FFD700; margin-bottom: 5px;">Lucky Charm</h4>
                <p style="color: #CCC; margin-bottom: 10px;">
                    1.5x ore drop chance for next 50 tiles mined<br>
                    <small style="color: #999;">Single use, temporary buff</small>
                </p>
                <p style="margin-bottom: 10px;">
                    Price: $${luckyCharmPrice} each | You have: ${this.gameState.consumables ? this.gameState.consumables.luckyCharms : 0}
                    ${charmActive ? `<br><span style="color: #4CAF50;">ACTIVE: ${this.gameState.buffs.luckyCharm.tilesRemaining} tiles remaining</span>` : ''}
                </p>
                <button 
                    onclick="window.storeMenu.buyLuckyCharm()"
                    style="background: ${canAffordCharm ? '#4CAF50' : '#555'}; 
                           color: white; 
                           border: none; 
                           padding: 10px 30px; 
                           cursor: ${canAffordCharm ? 'pointer' : 'not-allowed'};
                           opacity: ${canAffordCharm ? '1' : '0.6'};"
                    onmouseover="if(!this.disabled) this.style.background='#45a049'"
                    onmouseout="if(!this.disabled) this.style.background='#4CAF50'"
                    ${canAffordCharm ? '' : 'disabled'}
                    title="${canAffordCharm ? '' : 'Not enough cash'}"
                >
                    Buy 1 ($${luckyCharmPrice})
                </button>
            </div>
        `;
        
        // Explosive Charges
        const explosiveChargePrice = RESOURCE_PRICES.explosiveCharge;
        const canAffordExplosive = resources.cash >= explosiveChargePrice;
        const maxCharges = 5;
        const canBuyMore = this.gameState.consumables.explosiveCharges < maxCharges;
        html += `
            <div style="margin-bottom: 15px;">
                <h4 style="color: #FFD700; margin-bottom: 5px;">Explosive Charges</h4>
                <p style="color: #CCC; margin-bottom: 10px;">
                    Clear a 3x3 area instantly<br>
                    <small style="color: #999;">Limited quantity per trip (max ${maxCharges})</small>
                </p>
                <p style="margin-bottom: 10px;">
                    Price: $${explosiveChargePrice} each | You have: ${this.gameState.consumables.explosiveCharges}/${maxCharges}
                </p>
                <button 
                    onclick="window.storeMenu.buyExplosiveCharge()"
                    style="background: ${canAffordExplosive && canBuyMore ? '#4CAF50' : '#555'}; 
                           color: white; 
                           border: none; 
                           padding: 10px 30px; 
                           cursor: ${canAffordExplosive && canBuyMore ? 'pointer' : 'not-allowed'};
                           opacity: ${canAffordExplosive && canBuyMore ? '1' : '0.6'};"
                    onmouseover="if(!this.disabled) this.style.background='#45a049'"
                    onmouseout="if(!this.disabled) this.style.background='#4CAF50'"
                    ${canAffordExplosive && canBuyMore ? '' : 'disabled'}
                    title="${!canAffordExplosive ? 'Not enough cash' : !canBuyMore ? 'Max charges reached' : ''}"
                >
                    Buy 1 ($${explosiveChargePrice})
                </button>
            </div>
        `;
        
        html += `
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h3 style="color: #FFD700; margin-bottom: 15px;">⭐ Premium Upgrades</h3>
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 5px;">
        `;
        
        // Pocket Refinery
        const pocketRefineryPrice = RESOURCE_PRICES.pocketRefinery;
        if (!upgrades.pocketRefinery) {
            const canAfford = resources.cash >= pocketRefineryPrice;
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #FFD700; margin-bottom: 5px;">Pocket Refinery</h4>
                    <p style="color: #CCC; margin-bottom: 10px;">
                        Increases ore sell prices by 20%<br>
                        <small style="color: #999;">Passive income boost</small>
                    </p>
                    <p style="margin-bottom: 10px;">
                        Price: $${pocketRefineryPrice.toLocaleString()}
                    </p>
                    <button 
                        onclick="window.storeMenu.buyPocketRefinery()"
                        style="background: ${canAfford ? '#FFD700' : '#555'}; 
                               color: ${canAfford ? '#000' : 'white'}; 
                               border: none; 
                               padding: 10px 30px; 
                               cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                               opacity: ${canAfford ? '1' : '0.6'};"
                        onmouseover="if(!this.disabled) this.style.background='#FFC700'"
                        onmouseout="if(!this.disabled) this.style.background='#FFD700'"
                        ${canAfford ? '' : 'disabled'}
                        title="${canAfford ? '' : 'Not enough cash'}"
                    >
                        Purchase ($${pocketRefineryPrice.toLocaleString()})
                    </button>
                </div>
            `;
        } else {
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #4CAF50; margin-bottom: 5px;">✓ Pocket Refinery</h4>
                    <p style="color: #888;">Already purchased - 20% ore price boost active</p>
                </div>
            `;
        }
        
        // Deep Scanner
        const deepScannerPrice = RESOURCE_PRICES.deepScanner;
        if (!upgrades.deepScanner) {
            const canAfford = resources.cash >= deepScannerPrice;
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #FFD700; margin-bottom: 5px;">Deep Scanner</h4>
                    <p style="color: #CCC; margin-bottom: 10px;">
                        Reveals ore types in undiscovered tiles within 3-tile radius<br>
                        <small style="color: #999;">See what's worth digging toward</small>
                    </p>
                    <p style="margin-bottom: 10px;">
                        Price: $${deepScannerPrice.toLocaleString()}
                    </p>
                    <button 
                        onclick="window.storeMenu.buyDeepScanner()"
                        style="background: ${canAfford ? '#FFD700' : '#555'}; 
                               color: ${canAfford ? '#000' : 'white'}; 
                               border: none; 
                               padding: 10px 30px; 
                               cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                               opacity: ${canAfford ? '1' : '0.6'};"
                        onmouseover="if(!this.disabled) this.style.background='#FFC700'"
                        onmouseout="if(!this.disabled) this.style.background='#FFD700'"
                        ${canAfford ? '' : 'disabled'}
                        title="${canAfford ? '' : 'Not enough cash'}"
                    >
                        Purchase ($${deepScannerPrice.toLocaleString()})
                    </button>
                </div>
            `;
        } else {
            html += `
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #4CAF50; margin-bottom: 5px;">✓ Deep Scanner</h4>
                    <p style="color: #888;">Already purchased - 3-tile ore detection active</p>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h3 style="color: #00FFFF; margin-bottom: 15px;">🎫 Mining Licenses</h3>
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 5px;">
        `;
        
        // Add license section
        if (this.gameState.licenseManager) {
            const currentLicense = this.gameState.licenseManager.getCurrentLicense();
            const nextLicense = this.gameState.licenseManager.getNextAvailableLicense();
            
            html += `
                <div style="margin-bottom: 10px;">
                    <p style="color: #4CAF50;">Current License: ${currentLicense.name}</p>
                    <p style="color: #999; font-size: 14px;">Max Depth: ${currentLicense.maxDepth === Infinity ? 'Unlimited' : currentLicense.maxDepth + ' meters'}</p>
                </div>
            `;
            
            if (nextLicense) {
                const requirements = this.gameState.licenseManager.getRequirementsStatus(nextLicense.id);
                const canPurchase = this.gameState.licenseManager.checkRequirements(nextLicense.id) && 
                                   resources.cash >= nextLicense.price;
                
                html += `
                    <div style="border-top: 1px solid #444; padding-top: 15px;">
                        <h4 style="color: #FFD700; margin-bottom: 5px;">Next: ${nextLicense.name}</h4>
                        <p style="color: #CCC; margin-bottom: 10px;">
                            ${nextLicense.description}<br>
                            <small style="color: #999;">Max Depth: ${nextLicense.maxDepth === Infinity ? 'Unlimited' : nextLicense.maxDepth + ' meters'}</small>
                        </p>
                        
                        <div style="margin-bottom: 10px;">
                            <p style="color: #87CEEB; font-weight: bold; margin-bottom: 5px;">Requirements:</p>
                `;
                
                // Show all requirements
                for (const req of requirements) {
                    const color = req.met ? '#4CAF50' : '#FF6B6B';
                    const icon = req.met ? '✓' : '✗';
                    html += `
                        <p style="color: ${color}; font-size: 14px; margin: 2px 0;">
                            ${icon} ${req.name} - ${req.progress}
                        </p>
                    `;
                }
                
                html += `
                        </div>
                        
                        <p style="margin-bottom: 10px;">
                            Price: $${nextLicense.price.toLocaleString()}
                        </p>
                        
                        <button 
                            onclick="window.storeMenu.buyLicense('${nextLicense.id}')"
                            style="background: ${canPurchase ? '#00CED1' : '#555'}; 
                                   color: white; 
                                   border: none; 
                                   padding: 10px 30px; 
                                   cursor: ${canPurchase ? 'pointer' : 'not-allowed'};
                                   opacity: ${canPurchase ? '1' : '0.6'};"
                            onmouseover="if(!this.disabled) this.style.background='#00B8C5'"
                            onmouseout="if(!this.disabled) this.style.background='#00CED1'"
                            ${canPurchase ? '' : 'disabled'}
                            title="${canPurchase ? '' : 'Requirements not met or insufficient funds'}"
                        >
                            Purchase License ($${nextLicense.price.toLocaleString()})
                        </button>
                    </div>
                `;
            } else {
                html += `
                    <p style="color: #4CAF50; text-align: center; margin-top: 10px;">
                        🎉 You have the highest tier license! 🎉
                    </p>
                `;
            }
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
    
    buyBoots() {
        const cost = RESOURCE_PRICES.reinforcedBoots;
        const { resources, upgrades } = this.gameState;
        
        if (resources.cash >= cost && !upgrades.reinforcedBoots) {
            resources.cash -= cost;
            upgrades.reinforcedBoots = true;
            this.updateMenuContent();
            this.gameState.save();
        }
    }
    
    buyEnergyPack() {
        const cost = RESOURCE_PRICES.energyPack;
        const { resources, upgrades } = this.gameState;
        
        if (resources.cash >= cost && !upgrades.energyPack) {
            resources.cash -= cost;
            upgrades.energyPack = true;
            // Increase max energy and current energy
            resources.maxEnergy = 1500;
            resources.energy = Math.min(resources.energy + 500, 1500); // Give bonus 500 energy
            this.updateMenuContent();
            this.gameState.save();
        }
    }
    
    buyEnergyDrink() {
        const cost = RESOURCE_PRICES.energyDrink;
        const { resources, consumables } = this.gameState;
        
        if (resources.cash >= cost) {
            resources.cash -= cost;
            consumables.energyDrinks += 1;
            this.updateMenuContent();
            this.gameState.save();
        }
    }
    
    buyLuckyCharm() {
        const cost = RESOURCE_PRICES.luckyCharm;
        const { resources, consumables } = this.gameState;
        
        if (resources.cash >= cost) {
            resources.cash -= cost;
            consumables.luckyCharms += 1;
            this.updateMenuContent();
            this.gameState.save();
        }
    }
    
    buyPocketRefinery() {
        const cost = RESOURCE_PRICES.pocketRefinery;
        const { resources, upgrades } = this.gameState;
        
        if (resources.cash >= cost && !upgrades.pocketRefinery) {
            resources.cash -= cost;
            upgrades.pocketRefinery = true;
            this.updateMenuContent();
            this.gameState.save();
        }
    }
    
    buyDeepScanner() {
        const cost = RESOURCE_PRICES.deepScanner;
        const { resources, upgrades } = this.gameState;
        
        if (resources.cash >= cost && !upgrades.deepScanner) {
            resources.cash -= cost;
            upgrades.deepScanner = true;
            this.updateMenuContent();
            this.gameState.save();
        }
    }
    
    buyExplosiveCharge() {
        const cost = RESOURCE_PRICES.explosiveCharge;
        const { resources, consumables } = this.gameState;
        const maxCharges = 5;
        
        if (resources.cash >= cost && consumables.explosiveCharges < maxCharges) {
            resources.cash -= cost;
            consumables.explosiveCharges += 1;
            this.updateMenuContent();
            this.gameState.save();
        }
    }
    
    buyIronPickaxe() {
        const cost = RESOURCE_PRICES.ironPickaxe;
        const { resources, upgrades } = this.gameState;
        
        if (resources.cash >= cost && upgrades.improvedPickaxe && !upgrades.ironPickaxe) {
            resources.cash -= cost;
            upgrades.ironPickaxe = true;
            this.updateMenuContent();
            this.gameState.save();
        }
    }
    
    buyDiamondPickaxe() {
        const cost = RESOURCE_PRICES.diamondPickaxe;
        const { resources, upgrades } = this.gameState;
        
        if (resources.cash >= cost && upgrades.ironPickaxe && !upgrades.diamondPickaxe) {
            resources.cash -= cost;
            upgrades.diamondPickaxe = true;
            this.updateMenuContent();
            this.gameState.save();
        }
    }
    
    buyLicense(licenseId) {
        if (this.gameState.licenseManager) {
            const success = this.gameState.licenseManager.purchaseLicense(licenseId);
            if (success) {
                this.updateMenuContent();
                this.gameState.save();
                
                // Show success message
                if (this.gameState.playerRef) {
                    const license = this.gameState.licenseManager.getCurrentLicense();
                    this.gameState.playerRef.miningMessage = `License upgraded to ${license.name}!`;
                    this.gameState.playerRef.miningMessageTime = 3000;
                    this.gameState.playerRef.miningMessageType = 'regular';
                }
            }
        }
    }
}