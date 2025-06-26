# Running the Game

This game uses ES6 modules, so it needs to be served from a web server (not just opened as a file).

## Quick Start

### Option 1: Using Python (Recommended)
```bash
# If you have Python 3
python3 -m http.server 8000

# If you have Python 2
python -m SimpleHTTPServer 8000
```
Then open http://localhost:8000 in your browser.

### Option 2: Using Node.js
```bash
# Install http-server globally
npm install -g http-server

# Run the server
http-server -p 8000
```
Then open http://localhost:8000 in your browser.

### Option 3: Using VS Code Live Server
If you're using VS Code, install the "Live Server" extension and right-click on `index.html` to select "Open with Live Server".

## Controls

- **Arrow Keys** or **WASD**: Move player
- **Down Arrow** at elevator: Enter the mine
- **Up Arrow** in elevator shaft: Return to surface
- **D**: Toggle debug information
- **Touch Controls**: On mobile, use the on-screen buttons

## Game Structure

```
2d-miner/
├── index.html          # Main HTML file
├── style.css          # Styles
├── src/
│   ├── main.js        # Entry point
│   ├── core/
│   │   ├── Constants.js    # Game constants
│   │   ├── GameState.js    # State management
│   │   └── Game.js         # Main game class
│   ├── entities/
│   │   └── Player.js       # Player logic
│   └── systems/
│       ├── Renderer.js     # Rendering system
│       ├── InputManager.js # Input handling
│       └── Camera.js       # Camera system
```