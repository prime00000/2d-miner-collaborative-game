# Deep Dig Mining Co.

A 2D mining game where you dig deep into the earth, collect valuable ores, and manage your resources to become the ultimate mining tycoon!

## Features

- Grid-based mining mechanics with auto-mining on collision
- Energy management system - every action costs energy
- Procedurally generated underground with various ore types
- Fog of war system with tile discovery mechanics
- Fall damage and gravity physics
- Economy system with ore collection and selling
- Building interactions (Elevator, Store, Assayer, Medical)
- Emergency energy purchases when running low underground
- Death penalty system with resurrection at hospital
- Upgrade system (Improved Pickaxe)

## How to Play

- **Movement**: Use WASD or Arrow keys to move
- **Mining**: Move into tiles to automatically mine them
- **Interact**: Press SPACE or E near buildings
- **Return to Surface**: Use the elevator shaft to go up/down

## Docker Setup

### Prerequisites
1. Install Docker Desktop:
   - **Windows/Mac**: Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - **Linux**: Follow instructions at [docs.docker.com/engine/install](https://docs.docker.com/engine/install/)

### Running the Game

1. Open a terminal in the project directory
2. Start the game server:
   ```bash
   docker-compose up
   ```
3. Open your browser and go to: `http://localhost:8080`
4. The game will automatically reload when you make changes to the code!

### Stopping the Game

To stop the container, press `Ctrl+C` in the terminal or run:
```bash
docker-compose down
```

### Troubleshooting

- **Port 8080 already in use?** Change the port in `docker-compose.yml`:
  ```yaml
  ports:
    - "3000:80"  # Change 8080 to any available port
  ```
- **Changes not showing?** Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### Troubleshooting Docker

If you get a **"401 Unauthorized"** error when running `docker-compose up`, here's how to fix it:

1. **Check if Docker Desktop is running:**
   - **Windows**: Look for the whale icon in your system tray (bottom-right)
   - **Mac**: Look for the whale icon in your menu bar (top-right)
   - **Linux**: Run `docker ps` - if it errors, Docker isn't running
   
   If Docker isn't running, start Docker Desktop and wait for it to fully load.

2. **Try pulling the image manually:**
   ```bash
   docker pull nginx:alpine
   ```
   This downloads the base image we need for the game.

3. **If step 2 fails, reset Docker:**
   ```bash
   docker logout
   docker system prune -a
   ```
   - `docker logout` - Signs you out of Docker Hub (in case of authentication issues)
   - `docker system prune -a` - Cleans up all Docker data (images, containers, etc.)
   
   **Note**: The prune command will delete ALL Docker images on your system. This is safe but means Docker will need to re-download everything.

4. **After resetting, try pulling the image again:**
   ```bash
   docker pull nginx:alpine
   ```

5. **Once the image downloads successfully, run the game:**
   ```bash
   docker-compose up
   ```

**Still having issues?** Try restarting Docker Desktop completely (Quit and reopen the application).

## Getting Updates

When the instructor pushes updates to the main repository:

1. **Pull the latest changes:**
   ```bash
   git pull origin main
   ```
   This downloads any new code or features added by the instructor.

2. **Refresh your browser** to see the changes (Ctrl+R or Cmd+R)

3. **If Docker files changed, rebuild the container:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```
   - `docker-compose down` - Stops and removes the current container
   - `docker-compose up --build` - Rebuilds the image with any Docker configuration changes

**Note**: Most code changes will appear immediately after refreshing your browser. You only need to rebuild the container if the `Dockerfile` or `docker-compose.yml` files were updated.

## Development

The game uses vanilla JavaScript with ES6 modules. Key directories:
- `/src` - All game source code
- `/src/core` - Core game systems (Game, GameState, Constants)
- `/src/entities` - Game entities (Player, World)
- `/src/systems` - Game systems (Renderer, InputManager, Camera)
- `/src/ui` - UI components (menus)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

MIT License - see LICENSE file for details