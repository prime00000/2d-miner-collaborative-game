export class InputManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.setupKeyboardInput();
        this.setupTouchInput();
    }
    
    setupKeyboardInput() {
        window.addEventListener('keydown', (e) => {
            this.gameState.input.keys[e.key.toLowerCase()] = true;
            
            // Toggle debug mode with 'd' key
            if (e.key.toLowerCase() === 'd') {
                const debugInfo = document.getElementById('debugInfo');
                if (debugInfo) {
                    debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.gameState.input.keys[e.key.toLowerCase()] = false;
        });
    }
    
    setupTouchInput() {
        const controlBtns = document.querySelectorAll('.controlBtn');
        
        controlBtns.forEach(btn => {
            // Touch events
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                this.gameState.input.touches[action] = true;
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                this.gameState.input.touches[action] = false;
            });
            
            // Mouse events for testing
            btn.addEventListener('mousedown', (e) => {
                const action = btn.dataset.action;
                this.gameState.input.touches[action] = true;
            });
            
            btn.addEventListener('mouseup', (e) => {
                const action = btn.dataset.action;
                this.gameState.input.touches[action] = false;
            });
            
            btn.addEventListener('mouseleave', (e) => {
                const action = btn.dataset.action;
                this.gameState.input.touches[action] = false;
            });
        });
    }
    
    getInput() {
        return this.gameState.input;
    }
    
    isKeyPressed(key) {
        return this.gameState.input.keys[key.toLowerCase()] || false;
    }
    
    isTouchActive(action) {
        return this.gameState.input.touches[action] || false;
    }
    
    clearInput() {
        this.gameState.input.keys = {};
        this.gameState.input.touches = {};
    }
}