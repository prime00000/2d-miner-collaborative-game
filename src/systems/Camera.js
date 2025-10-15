import { SURFACE_Y } from '../core/Constants.js';

export class Camera {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.gameState = gameState;
    }
    
    update() {
        const { player, camera } = this.gameState;
        
        // Center camera on player horizontally
        camera.x = player.x - this.canvas.width / 2;
        camera.x = Math.max(0, camera.x);
        
        // Vertical camera
        if (player.isUnderground) {
            camera.y = player.y - this.canvas.height / 2;
            // Allow camera to follow player properly underground
            // No clamping needed since player position is already constrained
        } else {
            camera.y = 0;
        }
    }
    
    getPosition() {
        return {
            x: this.gameState.camera.x,
            y: this.gameState.camera.y
        };
    }
}