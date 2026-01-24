# Enemy Eyes - Complete Web Game Development Guide

## How to Use This Document

This guide contains everything you need to build "Enemy Eyes" - a unique wave survival shooter with a true second-person camera system, built for the web using Babylon.js.

### Workflow:
1. Create your project folder
2. Copy `CLAUDE.md` and `GAME_SPEC.md` into the folder
3. Open Claude Code in that folder
4. Work through phases one at a time
5. Test each phase in your browser before moving to the next

---

# PART 1: PROJECT SETUP FILES

## File 1: CLAUDE.md

Create this file in your project root. Claude Code reads this automatically.

```markdown
# Enemy Eyes - Web Game Development Guide

## Project Overview
This is a web-based 3D wave survival shooter with a unique "true second-person" 
camera system where the player sees themselves through enemy eyes.

## Tech Stack
- Engine: Babylon.js 6.x
- Language: JavaScript (ES6+)
- Physics: Babylon.js built-in physics (Havok or Cannon.js)
- Audio: Babylon.js audio engine (or Howler.js)
- Build Tool: Vite
- Platform: Web browser (Chrome, Firefox, Safari, Edge)

## Key Concept
The camera attaches to enemies and looks AT the player. When an enemy dies, 
camera switches to next enemy. This creates a unique disorienting gameplay.

## Core Rules for Development
1. Always keep the game in a runnable state
2. Test each feature before moving to next
3. Use simple placeholder meshes (boxes, spheres) until gameplay works
4. Comment code clearly for learning purposes
5. Use ES6 modules for clean code organization
6. Test in browser with `npm run dev`

## File Structure
project-root/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js              # Entry point
│   ├── core/
│   │   ├── Game.js          # Main game class
│   │   ├── InputManager.js  # Keyboard/mouse input
│   │   └── AssetLoader.js   # Load models/sounds
│   ├── player/
│   │   ├── PlayerController.js
│   │   ├── PlayerHealth.js
│   │   ├── WeaponInventory.js
│   │   └── AbilitySystem.js
│   ├── camera/
│   │   ├── SecondPersonCamera.js
│   │   └── CameraTarget.js
│   ├── combat/
│   │   ├── Weapon.js
│   │   ├── WeaponRifle.js
│   │   ├── WeaponPistol.js
│   │   ├── WeaponShotgun.js
│   │   └── DamageSystem.js
│   ├── enemies/
│   │   ├── EnemyBase.js
│   │   ├── EnemyGrunt.js
│   │   ├── EnemySoldier.js
│   │   ├── EnemySniper.js
│   │   ├── EnemyHeavy.js
│   │   ├── EnemyBoss.js
│   │   └── EnemySpawner.js
│   ├── gameflow/
│   │   ├── GameManager.js
│   │   ├── WaveManager.js
│   │   ├── ScoreManager.js
│   │   ├── BuyPhase.js
│   │   └── SaveManager.js
│   ├── ui/
│   │   ├── HUD.js
│   │   ├── BuyMenuUI.js
│   │   ├── GameOverUI.js
│   │   ├── MainMenuUI.js
│   │   └── PauseMenuUI.js
│   ├── audio/
│   │   └── AudioManager.js
│   ├── effects/
│   │   └── EffectsManager.js
│   └── utils/
│       └── helpers.js
├── public/
│   ├── models/
│   ├── sounds/
│   ├── textures/
│   └── fonts/
└── styles/
    └── main.css

## Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production

## Reference
See GAME_SPEC.md for complete game design specification.
```

---

## File 2: GAME_SPEC.md

Create this file in your project root.

```markdown
# Game Specification: "Enemy Eyes" — Wave Survival Shooter

## Overview

| Aspect | Choice |
|--------|--------|
| Camera | True Second-Person — view through enemy/environment perspectives |
| Mode | Wave Survival — defend against endless enemy waves |
| Engine | Babylon.js (JavaScript) |
| Platform | Web browser |
| Players | Single-player vs AI |

---

## True Second-Person Camera System

### How It Works
- The camera is NOT attached to the player
- Camera attaches to enemies, security cameras, or fixed points in the level
- You see your own character from the enemy's viewpoint
- Camera switches between viewpoints as enemies die or move

### Camera Sources (Priority Order)
1. Nearest alive enemy — see yourself through their eyes
2. Security cameras — fixed positions around the arena
3. Drone camera — fallback floating camera if no enemies exist

### Camera Behaviors
| Situation | Camera Behavior |
|-----------|-----------------|
| Enemies alive | Camera on closest enemy looking at player |
| Current camera enemy dies | Snap to next nearest enemy |
| No enemies (between waves) | Security camera or drone view |
| Boss fight | Camera on boss drone |

### Player Assists
- Player outline — subtle glow so you can always spot yourself
- Crosshair — still shows where you're aiming
- Minimap — helps with orientation
- Audio cues — directional sound for enemy positions

---

## Wave Survival Mode

### Wave Structure
[Wave Start] → [Enemies Spawn] → [Combat] → [All Enemies Dead] → [Wave Complete] → [Buy Phase: 15 seconds] → [Next Wave]

### Wave Progression
| Wave | Enemy Count | Enemy Types | Special |
|------|-------------|-------------|---------|
| 1-3 | 5-10 | Grunts only | Tutorial waves |
| 4-6 | 10-15 | Grunts + Soldiers | — |
| 7-9 | 15-20 | Add Snipers | Faster spawns |
| 10 | 10 + Boss | All types + Mini-boss | Boss wave |
| 11+ | Scaling | All types | Endless, increasing difficulty |

### Scoring
| Action | Points |
|--------|--------|
| Grunt kill | 100 |
| Soldier kill | 200 |
| Sniper kill | 250 |
| Heavy kill | 300 |
| Boss kill | 1000 |
| Wave clear bonus | Wave × 500 |
| No damage bonus | +50% wave score |

---

## Arena Design: "The Compound"

### Layout
- 50x50 unit arena with walls
- 4 enemy spawn points at edges (A, B, C, D)
- 3 security camera positions (elevated, looking down)
- Cover objects (crates, walls, pillars)
- Health/ammo pickup locations

---

## Player Agent: "Blaze"

### Stats
| Stat | Value |
|------|-------|
| Health | 100 |
| Shield | 50 (regenerates slowly) |
| Move Speed | 5 m/s |
| Sprint Speed | 8 m/s |

### Abilities
| Ability | Key | Description | Cooldown |
|---------|-----|-------------|----------|
| Flash Bang | Q | Blinds/stuns enemies in radius | 15 sec |
| Dash | E | Quick dodge in movement direction | 8 sec |
| Fire Wall | C | Creates burning barrier, damages enemies | 20 sec |
| Ultimate: Inferno | X | Massive fire explosion around player | 10 kills to charge |

---

## Enemy Types

### Grunt
- Health: 50
- Speed: Fast (4 m/s)
- Attack: Melee (runs at player, 10 damage)
- Camera view: Shaky, aggressive

### Soldier
- Health: 100
- Speed: Medium (3 m/s)
- Attack: Rifle, ranged (10 damage per shot)
- Behavior: Stops at range 10, shoots
- Camera view: Stable, tactical

### Sniper
- Health: 75
- Speed: Slow (2 m/s)
- Attack: High damage (25), slow fire rate
- Behavior: Stays at distance (range 20+)
- Camera view: Zoomed, focused

### Heavy
- Health: 200
- Speed: Very slow (2 m/s)
- Attack: Melee (25 damage)
- Behavior: Walks directly at player
- Camera view: Low angle, intimidating

### Mini-Boss: "Watcher"
- Health: 500
- Attacks: Laser beam, spawn minions, ground slam
- Special: Has drone camera (priority 0)
- Camera view: Drone gives overhead perspective

---

## Weapons

### Starting Loadout
- Pistol (infinite ammo, 25 damage)
- Rifle (30 ammo, 35 damage)

### Buyable Weapons
| Weapon | Price | Damage | Fire Rate | Ammo |
|--------|-------|--------|-----------|------|
| Shotgun | 800 | 15×6 pellets | Slow | 8 |
| SMG | 1200 | 15 | Very fast | 45 |
| Sniper Rifle | 1500 | 100 | Very slow | 5 |
| Rocket Launcher | 2000 | 150 (AOE) | Slow | 3 |

---

## Buy System

### Between Waves (15 seconds)
| Item | Price | Effect |
|------|-------|--------|
| Ammo Refill | 200 | Full ammo all weapons |
| Health Pack | 400 | Restore 50 health |
| Shield Recharge | 300 | Restore 50 shield |
| Ability Refresh | 500 | Reset all cooldowns |
| Shotgun | 800 | Unlock shotgun |
| SMG | 1200 | Unlock SMG |

### Economy
- Kill grant: 100 credits per enemy (varies by type)
- Wave clear: bonus credits

---

## Controls

| Action | Key |
|--------|-----|
| Move | WASD |
| Look/Aim | Mouse |
| Shoot | Left Click |
| Ability 1 (Flash) | Q |
| Ability 2 (Dash) | E |
| Ability 3 (Fire Wall) | C |
| Ultimate | X |
| Reload | R |
| Sprint | Shift |
| Switch Weapon | 1-4 |
| Buy Menu | B |
| Pause | Escape |
```

---

# PART 2: PHASE-BY-PHASE PROMPTS

Copy and paste these prompts one at a time into Claude Code.
Wait for each phase to complete and test before moving to next.

---

## PHASE 1: Project Foundation

```
Read GAME_SPEC.md for full context.

PHASE 1: Project Setup (Babylon.js Web Game)

Create the web project foundation:

1. Initialize npm project with package.json:
   - name: "enemy-eyes"
   - Dependencies: @babylonjs/core, @babylonjs/gui, @babylonjs/loaders
   - Dev dependencies: vite
   - Scripts: "dev": "vite", "build": "vite build"

2. Create vite.config.js for development server

3. Create index.html:
   - Full viewport canvas element
   - Link to main.css
   - Load src/main.js as module

4. Create styles/main.css:
   - Reset margins/padding
   - Canvas fills entire viewport
   - Hide overflow

5. Create src/main.js:
   - Import Babylon.js
   - Create engine and scene
   - Basic render loop

6. Create src/core/Game.js:
   - Game class that initializes everything
   - Creates scene, lights, and basic environment
   - For now: just a ground plane (50x50) and basic lighting

7. Create the arena in the scene:
   - Ground plane (50x50 units) with gray material
   - 4 walls around edges (box meshes)
   - 5-6 box obstacles for cover scattered around
   - 4 empty positions stored as Vector3 for spawn points (A, B, C, D at edges)
   - 3 elevated positions stored as Vector3 for camera points

Do not create player or enemies yet. Just the scene setup.

Output: All files created with full code. List the project structure.
```

**Test:** Run `npm install` then `npm run dev`, open browser, see the 3D arena with walls and cover.

---

## PHASE 2: Player Controller

```
Read GAME_SPEC.md for full context.

PHASE 2: Player Controller (Babylon.js)

Create player movement system:

1. Create src/player/PlayerController.js:
   - PlayerController class
   - Creates player mesh: capsule shape (or cylinder, height 2, diameter 1)
   - Colored material so player is visible (bright color like blue or green)
   - Properties: moveSpeed (5), sprintSpeed (8), isSpinting (false)

2. Create src/core/InputManager.js:
   - Singleton class to handle all input
   - Track pressed keys in a Map/Set
   - Track mouse position
   - Methods: isKeyDown(key), getMousePosition()
   - Listen to keydown, keyup, mousemove events
   - Pointer lock for FPS-style mouse control

3. PlayerController movement:
   - WASD movement relative to player facing direction
   - Shift to sprint (8 units/sec) vs walk (5 units/sec)
   - Player rotates based on mouse X movement (left/right look)
   - Use Babylon.js physics or simple position updates
   - Collision detection with walls and obstacles using moveWithCollisions or intersectsMesh

4. Integrate into Game.js:
   - Create InputManager
   - Create PlayerController
   - Update player in render loop

5. Add a temporary free camera for testing (we'll replace with second-person camera next phase)

Test criteria: Player moves with WASD, sprints with Shift, rotates with mouse, can't walk through walls.

Output: Full code for PlayerController.js, InputManager.js, and updated Game.js with comments.
```

**Test:** Run game, move with WASD, rotate with mouse, collide with walls.

---

## PHASE 3: Second-Person Camera System

```
Read GAME_SPEC.md for full context.

PHASE 3: True Second-Person Camera (Babylon.js)

This is the CORE UNIQUE MECHANIC. The camera sees the player through enemy eyes.

1. Create src/camera/CameraTarget.js:
   - CameraTarget class
   - Properties: position (Vector3), priority (number), isActive (boolean)
   - Lower priority = more preferred (enemies=1, security cams=2)
   - Method: getPosition() returns current world position
   - Can be attached to a mesh or be a fixed point

2. Create src/camera/SecondPersonCamera.js:
   - SecondPersonCamera class
   - Uses Babylon.js FreeCamera or UniversalCamera (not attached to player!)
   - Maintains array of all CameraTarget objects
   - Methods:
     - registerTarget(cameraTarget)
     - unregisterTarget(cameraTarget)
     - findBestTarget() - returns target with lowest priority, closest to player
     - update() - called each frame
   - Camera behavior:
     - Position camera at current target's position
     - Always look at the player using camera.setTarget(playerPosition)
     - Smooth transition when switching targets (use Vector3.Lerp)
   - Public method: onTargetDestroyed(target) - removes target and finds new one

3. Create 3 CameraTarget instances for the security camera positions:
   - Place at elevated positions defined in Phase 1
   - Priority: 2 (fallback when no enemies)

4. Update Game.js:
   - Replace temporary camera with SecondPersonCamera
   - Register the 3 security camera targets
   - Update camera in render loop

Test criteria: 
- Camera stays at one security camera point, looking at player
- Player moves around, camera tracks them from fixed position
- Camera smoothly looks at player

Output: Full code for SecondPersonCamera.js, CameraTarget.js, and updated Game.js.
```

**Test:** Run game, camera is at elevated position looking down at you. Move around, camera follows your position.

---

## PHASE 4: Basic Enemy

```
Read GAME_SPEC.md for full context.

PHASE 4: Basic Enemy - Grunt (Babylon.js)

Create the simplest enemy to test camera switching.

1. Create src/enemies/EnemyBase.js:
   - Base class for all enemies
   - Properties: mesh, health, maxHealth, speed, isAlive, cameraTarget
   - Creates a CameraTarget attached to this enemy (priority 1)
   - Methods:
     - takeDamage(amount) - reduces health, calls die() if <= 0
     - die() - sets isAlive false, disposes mesh, notifies camera system
     - update(deltaTime) - virtual method for AI behavior
   - Event/callback: onDeath for notifying other systems

2. Create src/enemies/EnemyGrunt.js (extends EnemyBase):
   - Creates red box mesh (1x2x1) as placeholder
   - Health: 50
   - Speed: 4 units/sec
   - AI Behavior in update():
     - Get direction to player: player.position.subtract(this.position).normalize()
     - Move toward player: position.addInPlace(direction.scale(speed * deltaTime))
     - Rotate to face player
     - Simple collision avoidance with obstacles (optional for now)
   - When close to player (distance < 1.5): stop moving (damage comes later)

3. Update SecondPersonCamera.js:
   - When enemy is created, register its CameraTarget
   - Camera now prefers enemies (priority 1) over security cams (priority 2)
   - When enemy dies, unregister target and find next best target
   - Smooth transition between targets

4. Update Game.js:
   - Spawn 1 test enemy at a spawn point
   - Update enemy in render loop
   - Register enemy's camera target

Test criteria: 
- Camera should now be ON the enemy, looking at player
- You see yourself through the enemy's viewpoint!
- Enemy walks toward you
- Camera attached to enemy moves with it

Output: Full code for EnemyBase.js, EnemyGrunt.js, and updated SecondPersonCamera.js and Game.js.
```

**Test:** Camera is on the enemy looking at you. Enemy walks toward you. You see yourself from enemy's perspective!

---

## PHASE 5: Shooting System

```
Read GAME_SPEC.md for full context.

PHASE 5: Shooting (Babylon.js)

Add ability to shoot and kill enemies.

1. Create src/combat/Weapon.js:
   - Base weapon class
   - Properties: name, damage, fireRate, currentAmmo, maxAmmo, lastFireTime
   - Methods:
     - canFire() - checks ammo and fire rate cooldown
     - fire(origin, direction) - virtual, returns hit info
     - reload() - restores ammo

2. Create src/combat/WeaponRifle.js (extends Weapon):
   - Damage: 35
   - Fire rate: 150ms between shots
   - Ammo: 30/30
   - fire() method:
     - Use Babylon.js Ray for raycasting
     - Ray from player position toward crosshair direction
     - scene.pickWithRay() to detect hits
     - If hits enemy mesh, get enemy reference and call takeDamage()
     - Return hit result

3. Create src/combat/DamageSystem.js:
   - Static helper class
   - Method: processHit(pickResult, damage)
     - Checks if hit mesh has enemy component
     - Applies damage to enemy
     - Returns true if enemy was hit

4. Update PlayerController.js:
   - Add weapon property (starts with rifle)
   - On left mouse click: call weapon.fire()
   - R key: reload weapon
   - Calculate aim direction from player toward mouse pointer
     - Use scene.pick() with pointer position to get world point
     - Or cast ray forward from player's facing direction

5. Create crosshair UI:
   - Simple HTML/CSS crosshair (fixed center of screen)
   - Or use Babylon.js GUI AdvancedDynamicTexture with Image

6. Visual feedback:
   - Muzzle flash: brief point light or sprite at gun position
   - Hit effect: small particle burst or sphere at hit point
   - Debug: console.log when hitting enemy

7. Update enemy death:
   - When enemy dies, SecondPersonCamera.onTargetDestroyed() is called
   - Camera switches to next enemy or falls back to security cam

Test criteria:
- Crosshair visible at center of screen
- Click shoots raycast
- Raycast detects enemy hits
- Enemy takes damage (console log)
- Enemy dies after enough shots (35 damage × 2 = 70 > 50 health)
- Camera switches when enemy dies

Output: All weapon scripts, updated PlayerController.js, crosshair setup, and debug output.
```

**Test:** Shoot at enemy, see hit feedback, enemy dies, camera switches to fallback.

---

## PHASE 6: Enemy Spawner

```
Read GAME_SPEC.md for full context.

PHASE 6: Enemy Spawning (Babylon.js)

Create system to spawn enemies at spawn points.

1. Create src/enemies/EnemySpawner.js:
   - Properties:
     - spawnPoints: array of Vector3 (the 4 spawn points A, B, C, D)
     - enemyPrefab: reference to enemy class (EnemyGrunt for now)
     - activeEnemies: array of alive enemies
     - scene: Babylon scene reference
   - Methods:
     - spawnEnemy(position) - creates new EnemyGrunt at position, adds to activeEnemies
     - spawnWave(count) - spawns 'count' enemies at random spawn points with slight delay
     - getRandomSpawnPoint() - returns random spawn point Vector3
     - removeEnemy(enemy) - removes from activeEnemies when dead
     - getAliveCount() - returns number of alive enemies
   - Event: onAllEnemiesDead - fires when activeEnemies becomes empty

2. Create src/gameflow/GameManager.js:
   - Singleton pattern for easy access anywhere
   - Properties:
     - scene, player, camera, spawner
     - gameState: 'playing', 'buyPhase', 'gameOver'
     - totalKills: number
   - Methods:
     - startGame() - initializes everything
     - update(deltaTime) - main update loop
     - onEnemyKilled() - increments kills, checks if wave clear
   - For now:
     - Spawn 3 enemies at start
     - When all 3 dead, spawn 3 more
     - Track total kills

3. Update EnemyBase.js:
   - On death, notify GameManager.onEnemyKilled()
   - On death, notify EnemySpawner.removeEnemy()

4. Update Game.js:
   - Create GameManager instance
   - GameManager handles spawning (remove test enemy code)
   - Update GameManager in render loop

Test criteria:
- Game starts, 3 enemies spawn at random edge positions
- Kill all 3, 3 more spawn
- Total kills tracked
- Camera always finds an enemy to attach to

Output: EnemySpawner.js, GameManager.js, and updated Game.js with full code.
```

**Test:** Enemies spawn, kill them, more spawn automatically. Continuous gameplay loop.

---

## PHASE 7: Wave System

```
Read GAME_SPEC.md for full context.

PHASE 7: Wave Manager (Babylon.js)

Create proper wave progression system.

1. Create src/gameflow/WaveManager.js:
   - Properties:
     - currentWave: number (starts at 1)
     - waveState: 'spawning', 'inProgress', 'completed', 'buyPhase'
     - enemiesPerWave: calculated as baseCount(3) + (waveNumber × 2)
     - buyPhaseDuration: 15 seconds
     - buyPhaseTimer: countdown
   - Methods:
     - startWave(waveNumber) - calculates enemy count, tells spawner to spawn
     - onWaveCleared() - called when all enemies dead
     - startBuyPhase() - 15 second countdown
     - update(deltaTime) - handles state transitions and timers
   - Wave flow:
     - Wave starts → enemies spawn → combat → all dead → 3 sec pause → buy phase (15 sec) → next wave

2. Create src/ui/HUD.js:
   - Uses Babylon.js GUI (AdvancedDynamicTexture.CreateFullscreenUI)
   - Display elements:
     - Wave number: "Wave 1" (top center)
     - Enemies remaining: "Enemies: 5" (top left)
     - Message area for "Wave Complete!" (center, fades out)
     - Buy phase countdown: "Next wave in: 10" (center during buy phase)
   - Methods:
     - updateWave(number)
     - updateEnemyCount(count)
     - showMessage(text, duration)
     - showBuyPhaseTimer(seconds)
     - hideBuyPhaseTimer()

3. Update GameManager.js:
   - Use WaveManager instead of simple spawn logic
   - Connect wave events to HUD updates
   - Remove old spawn logic

4. Update EnemySpawner.js:
   - Add method: spawnWaveWithDelay(count, delayBetween) - spawns enemies with staggered timing

Test criteria:
- Wave 1 starts with 5 enemies
- HUD shows "Wave 1" and enemy count
- Kill all enemies
- "Wave Complete!" message shows
- 3 second pause
- Buy phase: 15 second countdown
- Wave 2 starts with 7 enemies

Output: WaveManager.js, HUD.js, and updated GameManager.js.
```

**Test:** Waves progress with increasing enemies, UI updates in real-time.

---

## PHASE 8: Player Health

```
Read GAME_SPEC.md for full context.

PHASE 8: Player Health & Damage (Babylon.js)

1. Create src/player/PlayerHealth.js:
   - Properties:
     - maxHealth: 100
     - currentHealth: 100
     - maxShield: 50
     - currentShield: 50
     - isAlive: true
   - Methods:
     - takeDamage(amount):
       - Damage hits shield first
       - If shield depleted, overflow goes to health
       - If health <= 0, call die()
     - heal(amount) - restores health up to max
     - restoreShield(amount) - restores shield up to max
     - die() - sets isAlive false, triggers game over
   - Events/callbacks: onHealthChanged, onShieldChanged, onDeath

2. Update EnemyGrunt.js:
   - When enemy reaches player (distance < 1.5):
     - Deal 10 damage to player via PlayerHealth.takeDamage(10)
     - Destroy self (suicide attack behavior)
     - Or: simple cooldown between attacks if you want them to survive

3. Update HUD.js:
   - Add health bar (red rectangle that shrinks)
   - Add shield bar (blue rectangle above health bar)
   - Position at bottom left or bottom center
   - Visual flash/pulse when taking damage (tint screen red briefly)
   - Methods: updateHealth(current, max), updateShield(current, max)

4. Create src/ui/GameOverUI.js:
   - Hidden by default (visible = false)
   - Shows on player death:
     - "GAME OVER" title
     - "Wave Reached: X"
     - "Total Kills: Y"
     - "Restart" button
   - Restart button: reloads the page or calls GameManager.restartGame()
   - Semi-transparent dark overlay behind UI

5. Update GameManager.js:
   - Add gameOver state
   - On player death: show GameOverUI, stop game loop
   - restartGame() method - location.reload() or reset all state

6. Integrate PlayerHealth into PlayerController or keep separate
   - GameManager holds reference to PlayerHealth
   - Enemies access player health through GameManager

Test criteria:
- Health and shield bars visible on HUD
- Enemy reaches player, player takes damage, bars decrease
- Shield depletes before health
- Health reaches 0, game over screen appears
- Can click restart to play again

Output: PlayerHealth.js, GameOverUI.js, updated HUD.js, EnemyGrunt.js, and GameManager.js.
```

**Test:** Take damage from enemies, see health bars decrease, die and see game over, restart works.

---

## PHASE 9: Score & Credits

```
Read GAME_SPEC.md for full context.

PHASE 9: Score and Economy (Babylon.js)

1. Create src/gameflow/ScoreManager.js:
   - Singleton for easy access
   - Properties:
     - score: number (display points)
     - credits: number (currency for buying)
   - Methods:
     - addKill(enemyType):
       - Grunt: +100 score, +100 credits
       - Soldier: +200 score, +200 credits (for later)
       - Sniper: +250 score, +250 credits (for later)
       - Heavy: +300 score, +300 credits (for later)
       - Boss: +1000 score, +1000 credits (for later)
     - addWaveBonus(waveNumber): adds waveNumber × 500 to score
     - spendCredits(amount): subtracts from credits, returns true if successful
     - getScore(), getCredits()
   - Events: onScoreChanged, onCreditsChanged

2. Update HUD.js:
   - Score display: "Score: 0" (top right)
   - Credits display: "$ 0" or "Credits: 0" (below score or top right)
   - Floating point popup when gaining points (optional):
     - "+100" text appears at screen position, floats up, fades out
   - Methods: updateScore(score), updateCredits(credits), showPointPopup(amount, position)

3. Update EnemyBase.js:
   - On death, call ScoreManager.addKill(this.type)
   - Each enemy class sets its own type identifier

4. Update WaveManager.js:
   - On wave complete, call ScoreManager.addWaveBonus(currentWave)

5. Update GameManager.js:
   - Create ScoreManager instance
   - Pass to other systems as needed

Test criteria:
- Kill enemy, score increases by 100
- Credits increase by 100
- Complete wave, bonus points added (wave × 500)
- HUD updates in real time

Output: ScoreManager.js and updated HUD.js, EnemyBase.js, WaveManager.js.
```

**Test:** Kill enemies, watch score and credits increase. Complete wave, get bonus.

---

## PHASE 10: Buy System

```
Read GAME_SPEC.md for full context.

PHASE 10: Buy Phase Menu (Babylon.js)

1. Create src/gameflow/BuyPhase.js:
   - Manages buy menu state
   - Properties:
     - isOpen: boolean
     - items: array of buyable items with name, cost, effect
   - Methods:
     - open() - shows buy menu, pauses enemy spawning
     - close() - hides menu, signals ready for next wave
     - purchaseItem(itemId) - attempts purchase, returns success

2. Create src/ui/BuyMenuUI.js:
   - Uses Babylon.js GUI
   - Full panel overlay (semi-transparent background)
   - Title: "BUY PHASE"
   - Show current credits at top
   - Item buttons (vertical list):
     - "Ammo Refill - $200" → refills all weapon ammo
     - "Health Pack - $400" → restore 50 health
     - "Shield Recharge - $300" → restore 50 shield
     - "Skip / Ready" → closes menu, starts next wave early
   - Each button:
     - Shows item name and cost
     - Grayed out / disabled if can't afford
     - Click to purchase
     - Visual feedback on purchase (flash green) or fail (flash red)
   - Timer display: "Next wave in: 10" counting down
   - Methods:
     - show()
     - hide()
     - updateCredits(amount)
     - updateTimer(seconds)

3. Update WaveManager.js:
   - During buy phase, tell BuyPhase to open()
   - Timer counts down
   - Can end buy phase early via BuyPhase callback
   - When timer hits 0 or player clicks Ready, close menu and start next wave

4. Connect purchases to player systems:
   - "Ammo Refill": PlayerController.weapon.reload() or refillAllAmmo()
   - "Health Pack": PlayerHealth.heal(50)
   - "Shield Recharge": PlayerHealth.restoreShield(50)

5. Update InputManager.js:
   - B key toggles buy menu (only during buy phase)

Test criteria:
- Wave ends, buy menu automatically appears
- See items with prices
- See current credits
- Can't click items you can't afford (grayed out)
- Buy health pack: health increases, credits decrease, button flashes
- Close menu or timer ends, next wave starts

Output: BuyPhase.js, BuyMenuUI.js, updated WaveManager.js.
```

**Test:** Complete wave, buy menu opens, purchase items, credits decrease, effects apply.

---

## PHASE 11: Multiple Weapons

```
Read GAME_SPEC.md for full context.

PHASE 11: Weapon Variety (Babylon.js)

1. Create src/combat/WeaponPistol.js (extends Weapon):
   - Damage: 25
   - Fire rate: 400ms between shots
   - Ammo: Infinity (never needs reload)
   - Always owned by player

2. Create src/combat/WeaponShotgun.js (extends Weapon):
   - Damage: 15 per pellet
   - Pellets: 6 (spread pattern)
   - Fire rate: 800ms between shots
   - Ammo: 8/8
   - fire() method:
     - Cast 6 rays in a cone pattern (spread angle ~10 degrees)
     - Each ray that hits deals 15 damage
   - Must be purchased

3. Create src/combat/WeaponSMG.js (extends Weapon):
   - Damage: 15
   - Fire rate: 80ms (very fast)
   - Ammo: 45/45
   - Must be purchased

4. Create src/player/WeaponInventory.js:
   - Properties:
     - weapons: Map of weapon slot to Weapon instance
     - ownedWeapons: Set of weapon IDs player owns
     - currentWeaponSlot: number (1-4)
     - currentWeapon: reference to active weapon
   - Methods:
     - addWeapon(slot, weapon) - adds weapon to inventory
     - switchWeapon(slot) - switches if owned
     - unlockWeapon(weaponId) - marks weapon as owned
     - hasWeapon(weaponId) - checks ownership
     - getCurrentWeapon()
     - refillAllAmmo() - refills ammo for all weapons
   - Starting loadout:
     - Slot 1: Pistol (owned)
     - Slot 2: Rifle (owned)
     - Slot 3: Shotgun (locked until purchased)
     - Slot 4: SMG (locked until purchased)

5. Update PlayerController.js:
   - Use WeaponInventory instead of single weapon
   - Number keys 1-4 switch weapons
   - Only switch if weapon is owned
   - Display current weapon info

6. Update HUD.js:
   - Current weapon name: "Rifle"
   - Ammo display: "30 / 30" or "∞" for pistol
   - Weapon switch indicator (optional): show all slots, highlight current

7. Update BuyMenuUI.js:
   - Add weapon purchases:
     - "Shotgun - $800"
     - "SMG - $1200"
   - Once bought, show "OWNED" instead of price
   - Purchasing unlocks in WeaponInventory

8. Update BuyPhase.js:
   - Handle weapon purchase logic
   - Call WeaponInventory.unlockWeapon()

Test criteria:
- Start with pistol (1) and rifle (2)
- Press 1 and 2 to switch, HUD updates
- Press 3 - nothing happens (not owned)
- Buy shotgun in shop
- Press 3 now works, shotgun equipped
- Each weapon feels different (fire rate, damage)

Output: All weapon classes, WeaponInventory.js, and updated PlayerController, HUD, BuyMenuUI.
```

**Test:** Switch between weapons, buy new ones in shop, each has different behavior.

---

## PHASE 12: Player Abilities

```
Read GAME_SPEC.md for full context.

PHASE 12: Abilities - Blaze Agent (Babylon.js)

1. Create src/player/AbilitySystem.js:
   - Manages all abilities
   - Properties:
     - abilities: Map of key to Ability instance
     - ultimateCharge: 0-100 (needs 10 kills = 100%)
     - killsForUltimate: 10
   - Methods:
     - registerAbility(key, ability)
     - useAbility(key) - checks cooldown, executes if ready
     - addKillCharge() - adds 10% ultimate charge per kill
     - update(deltaTime) - updates all ability cooldowns
     - isUltimateReady() - returns ultimateCharge >= 100
   - Connect to InputManager for Q, E, C, X keys

2. Create src/player/abilities/Ability.js (base class):
   - Properties: name, cooldown, currentCooldown, isReady
   - Methods:
     - execute(player, scene) - virtual, override in subclasses
     - update(deltaTime) - reduces currentCooldown
     - startCooldown()

3. Create src/player/abilities/AbilityDash.js (extends Ability):
   - Key: E
   - Cooldown: 8 seconds
   - execute():
     - Dash 5 units in current movement direction (or forward if still)
     - Instant position change (or quick lerp)
     - Brief invincibility: set player.isInvincible = true for 0.2 sec
   - Visual: motion trail or blur effect (simple: spawn fading spheres behind)

4. Create src/player/abilities/AbilityFlashBang.js (extends Ability):
   - Key: Q
   - Cooldown: 15 seconds
   - execute():
     - Create projectile (small sphere) that travels forward
     - After 1 second (or on impact): explode
     - All enemies within radius 8: set stunned = true for 3 seconds
   - Visual: bright flash (white plane that fades), particles

5. Create src/player/abilities/AbilityFireWall.js (extends Ability):
   - Key: C
   - Cooldown: 20 seconds
   - execute():
     - Create a wall mesh in front of player (box: 8 wide, 3 tall, 0.5 deep)
     - Orange/red emissive material
     - Lasts 5 seconds then disappears
     - Enemies passing through take 20 damage per second
   - Visual: fire particles, glowing material

6. Create src/player/abilities/AbilityUltimate.js (extends Ability):
   - Key: X
   - No cooldown - uses charge instead
   - execute():
     - Only works if ultimateCharge >= 100
     - Large explosion radius (10 units) around player
     - All enemies in radius take 100 damage
     - Reset ultimateCharge to 0
   - Visual: massive fire explosion, screen shake, particles

7. Update EnemyBase.js:
   - Add isStunned property
   - If stunned, skip movement in update()
   - Stun duration countdown

8. Update HUD.js:
   - Ability icons in bottom center or corner
   - Show Q, E, C labels
   - Cooldown overlay (darkened, number countdown)
   - Ultimate meter: bar that fills with kills
   - When ultimate ready: glow or pulse effect

9. Update PlayerController.js:
   - Create AbilitySystem
   - Handle Q, E, C, X key presses
   - Update AbilitySystem each frame

10. Update ScoreManager or GameManager:
    - On enemy kill, call AbilitySystem.addKillCharge()

Test criteria:
- Press E: player dashes forward instantly, brief invincibility
- Press Q: flashbang projectile, enemies get stunned (stop moving)
- Press C: fire wall appears, enemies walking through take damage
- Get 10 kills: ultimate meter full
- Press X: big explosion, all nearby enemies take 100 damage
- All abilities show cooldowns on HUD

Output: AbilitySystem.js, all Ability classes, updated HUD, PlayerController, EnemyBase.
```

**Test:** All four abilities work with proper cooldowns, visuals, and effects.

---

## PHASE 13: More Enemy Types

```
Read GAME_SPEC.md for full context.

PHASE 13: Enemy Variety (Babylon.js)

1. Create src/enemies/EnemySoldier.js (extends EnemyBase):
   - Mesh: Blue box (1x2x1)
   - Health: 100
   - Speed: 3 units/sec
   - AI Behavior:
     - Move toward player until within range 10
     - Stop and shoot at player
     - Shoot every 1.5 seconds
     - Shooting: raycast toward player, if clear line of sight, deal damage
     - Damage: 10 per shot
   - Properties: attackRange, attackCooldown, lastAttackTime
   - Camera view: More stable than grunt

2. Create src/enemies/EnemySniper.js (extends EnemyBase):
   - Mesh: Yellow box (1x2x1)
   - Health: 75
   - Speed: 2 units/sec
   - AI Behavior:
     - Try to maintain distance (range 15-25)
     - If player gets too close, back away
     - Shoot every 3 seconds
     - Damage: 25 per shot (high damage!)
     - Before shooting: show laser sight (red line) for 1 second as warning
   - Visual: Red line (Babylon.js Lines mesh) pointing at player before shot

3. Create src/enemies/EnemyHeavy.js (extends EnemyBase):
   - Mesh: Large red box (2x3x2)
   - Health: 200
   - Speed: 2 units/sec (slow)
   - AI Behavior:
     - Walk directly toward player (simple, relentless)
     - Melee attack when close (distance < 2)
     - Damage: 25 per hit
     - Attack cooldown: 2 seconds
   - Camera view: Low angle, intimidating

4. Update EnemySpawner.js:
   - Support multiple enemy types
   - Method: spawnEnemy(type, position)
   - Enemy types enum or string: 'grunt', 'soldier', 'sniper', 'heavy'
   - Method: spawnWaveWithTypes(enemyCounts) - takes object like {grunt: 3, soldier: 2}

5. Update WaveManager.js:
   - Wave composition based on wave number:
     - Wave 1-3: Grunts only
     - Wave 4-6: Grunts + Soldiers (60% grunt, 40% soldier)
     - Wave 7-9: Grunts + Soldiers + Snipers
     - Wave 10+: All types including Heavy
   - Method: getWaveComposition(waveNumber) - returns enemy type counts

6. Update ScoreManager.js:
   - Different points per enemy type:
     - Grunt: 100
     - Soldier: 200
     - Sniper: 250
     - Heavy: 300

Test criteria:
- Wave 1-3: Only grunts spawn
- Wave 4: Soldiers appear, they stop at range and shoot at you
- Wave 7: Snipers appear, you see red laser warning before they shoot
- Wave 10+: Heavy enemies spawn, slow but tough
- Each enemy type worth different points
- Camera switches between different enemy types

Output: EnemySoldier.js, EnemySniper.js, EnemyHeavy.js, updated EnemySpawner, WaveManager, ScoreManager.
```

**Test:** Progress through waves, see different enemy types with unique behaviors.

---

## PHASE 14: Boss Wave

```
Read GAME_SPEC.md for full context.

PHASE 14: Mini-Boss - Watcher (Babylon.js)

1. Create src/enemies/EnemyBoss.js (extends EnemyBase):
   - Name: "Watcher"
   - Mesh: Large purple box (3x4x3)
   - Health: 500
   - Speed: 1.5 units/sec (slow)
   - Properties:
     - currentAttack: string
     - attackCooldowns: object tracking each attack's cooldown
     - drone: mesh for camera attachment
     - droneCameraTarget: CameraTarget with priority 0

   - Drone Setup:
     - Small box/sphere floating 5 units above boss
     - Follows boss position
     - Has CameraTarget with priority 0 (highest priority)
     - Camera attaches to drone during boss fight = cinematic overhead view

   - Attack 1 - Laser Beam:
     - Cooldown: 5 seconds
     - Warning: Red line appears for 1.5 seconds showing beam path
     - Then: Damage along the line (30 damage if player is in path)
     - Visual: Bright red beam, particles

   - Attack 2 - Spawn Minions:
     - Cooldown: 15 seconds
     - Spawns 3 grunts near boss position
     - Visual: Flash effect when spawning

   - Attack 3 - Ground Slam:
     - Only if player is close (< 5 units)
     - Cooldown: 8 seconds
     - Area damage around boss: 40 damage
     - Knockback: push player away
     - Visual: Shockwave ring, screen shake

   - AI Behavior:
     - Slowly move toward player
     - Cycle through attacks based on cooldowns and conditions
     - Prioritize ground slam if player is close

2. Update WaveManager.js:
   - Wave 10 is boss wave
   - Clear all regular enemies first (or spawn boss alone)
   - Only spawn the boss
   - Boss can spawn minion grunts during fight
   - After boss defeated, wave 11 continues normally
   - Wave 20, 30, etc.: boss + some regular enemies

3. Update HUD.js:
   - Boss health bar:
     - Large bar at top of screen (only visible during boss fight)
     - Shows boss name: "WATCHER"
     - Red health bar
   - Method: showBossHealth(name, current, max), hideBossHealth()

4. Update EnemySpawner.js:
   - Method: spawnBoss() - creates EnemyBoss instance
   - Track boss separately from regular enemies

5. Update GameManager/WaveManager:
   - Detect when boss spawns, show boss UI
   - Detect when boss dies, hide boss UI, continue to next wave

Test criteria:
- Reach wave 10
- Boss spawns, boss health bar appears at top
- Camera attaches to boss drone - cool overhead cinematic view!
- Boss uses laser beam (see warning line first)
- Boss spawns grunt minions
- If you get close, boss does ground slam with knockback
- Defeat boss (500 HP), wave 11 starts

Output: EnemyBoss.js with all attacks, updated HUD, WaveManager, EnemySpawner.
```

**Test:** Epic boss fight at wave 10 with multiple attacks and cinematic camera.

---

## PHASE 15: Audio

```
Read GAME_SPEC.md for full context.

PHASE 15: Sound Effects (Babylon.js)

1. Create src/audio/AudioManager.js:
   - Singleton for easy access
   - Uses Babylon.js Sound class
   - Properties:
     - sounds: Map of sound name to Sound instance
     - musicVolume: 0-1
     - sfxVolume: 0-1
     - currentMusic: Sound instance
   - Methods:
     - loadSound(name, url, options) - loads and stores sound
     - playSound(name) - plays sound effect once
     - playMusic(name, loop=true) - plays background music
     - stopMusic()
     - setMusicVolume(volume)
     - setSFXVolume(volume)
   - Preload sounds during game initialization

2. Sound effects to create/load:
   (Use free sounds from freesound.org or create placeholder beeps)

   Player sounds:
   - footstep.mp3 - loop while moving
   - shoot_rifle.mp3 - rifle fire
   - shoot_pistol.mp3 - pistol fire
   - shoot_shotgun.mp3 - shotgun blast
   - reload.mp3 - reload sound
   - player_hurt.mp3 - damage grunt
   - player_death.mp3 - death sound
   - dash.mp3 - whoosh sound
   - flashbang.mp3 - explosion/flash
   - firewall.mp3 - fire crackling
   - ultimate.mp3 - big explosion

   Enemy sounds:
   - grunt_attack.mp3 - grunt melee
   - soldier_shoot.mp3 - soldier gunfire
   - sniper_charge.mp3 - sniper charging beep
   - sniper_shoot.mp3 - sniper shot
   - heavy_stomp.mp3 - heavy footsteps
   - enemy_death.mp3 - generic death
   - boss_laser.mp3 - laser beam
   - boss_slam.mp3 - ground slam

   UI sounds:
   - wave_start.mp3 - wave beginning
   - wave_complete.mp3 - victory jingle
   - purchase.mp3 - cash register / success
   - purchase_fail.mp3 - error buzz
   - button_click.mp3 - UI click

   Music:
   - music_gameplay.mp3 - intense gameplay loop
   - music_boss.mp3 - more intense boss music
   - music_gameover.mp3 - somber game over

3. Update relevant classes to play sounds:

   PlayerController.js:
   - Play footstep sound when moving (with interval)
   - Play weapon fire sounds

   Weapon classes:
   - Each weapon plays its own fire sound

   PlayerHealth.js:
   - Play hurt sound on damage
   - Play death sound on death

   EnemyBase.js:
   - Play death sound on death

   Enemy classes:
   - Play attack sounds

   WaveManager.js:
   - Play wave_start when wave begins
   - Play wave_complete when wave cleared
   - Switch to boss music on wave 10

   BuyMenuUI.js:
   - Play purchase sound on successful buy
   - Play fail sound when can't afford

   AbilitySystem.js:
   - Play ability sounds on use

4. Create public/sounds/ folder structure:
   - Put placeholder or downloaded sounds here
   - Reference in AudioManager

Test criteria:
- Shooting makes appropriate weapon sounds
- Enemies make sounds when attacking and dying
- Wave start/complete has audio feedback
- Background music plays and loops
- Boss fight has different music
- UI interactions have sound feedback

Output: AudioManager.js with full implementation, list of sound files needed, integration code for other classes.
```

**Test:** Game has sound effects and music throughout all actions.

---

## PHASE 16: Visual Polish

```
Read GAME_SPEC.md for full context.

PHASE 16: Visual Effects (Babylon.js)

1. Create src/effects/EffectsManager.js:
   - Singleton for spawning visual effects
   - Methods:
     - spawnEffect(type, position, options) - creates and auto-disposes effects
     - createMuzzleFlash(position)
     - createHitSpark(position)
     - createExplosion(position, size)
     - createTrail(startPos, endPos)
   - Use Babylon.js ParticleSystem for most effects
   - Object pooling for frequently used effects (optional optimization)

2. Combat effects:
   - Muzzle flash:
     - Brief point light at gun position
     - Small particle burst (yellow/orange)
     - Duration: 0.1 seconds
   - Bullet impact / hit spark:
     - Small particle burst at hit location
     - Sparks flying outward
   - Enemy hit effect:
     - Red flash on enemy mesh (briefly change material emissive)
     - Small blood/damage particles
   - Enemy death:
     - Explosion particle effect
     - Mesh fades out or falls apart

3. Ability effects:
   - Dash trail:
     - Series of fading ghost meshes behind player
     - Or motion blur trail using particle ribbon
   - Flashbang:
     - Bright white flash (full-screen plane that fades)
     - Particle explosion
   - Fire wall:
     - Fire particle system (orange/red particles rising)
     - Glowing emissive material on wall mesh
     - Smoke particles
   - Ultimate explosion:
     - Large expanding sphere
     - Massive particle burst
     - Screen shake
     - Fire particles everywhere

4. Environment effects:
   - Ambient dust particles floating in arena
   - Subtle fog for atmosphere (scene.fogMode)

5. UI/Screen effects:
   - Damage vignette:
     - When player takes damage, show red gradient at screen edges
     - Fade out over 0.5 seconds
     - Use Babylon.js GUI full-screen rectangle with gradient
   - Low health warning:
     - When health < 25, pulsing red vignette
     - Heartbeat effect
   - Screen shake:
     - On big damage or explosions
     - Randomly offset camera position briefly
     - Method: shakeScreen(intensity, duration)

6. Player visibility:
   - Player outline/glow:
     - Since camera is on enemies, player needs to be visible
     - Add highlight layer or glow layer to player mesh
     - Babylon.js HighlightLayer: scene.getHighlightLayerByName() or create new
     - Subtle colored outline (white or team color)

7. Update SecondPersonCamera.js:
   - Add screen shake method
   - Shake on explosions, big hits

8. Integrate effects throughout:
   - Weapon.fire() → muzzle flash
   - Enemy.takeDamage() → hit effect
   - Enemy.die() → death explosion
   - Abilities → respective effects
   - PlayerHealth.takeDamage() → screen vignette, shake

Test criteria:
- Shooting shows muzzle flash
- Hitting enemies shows impact effect
- Enemy deaths have explosion effect
- Abilities have distinct visual effects
- Player always visible with outline glow
- Taking damage shows red screen flash
- Big explosions cause screen shake

Output: EffectsManager.js, particle system configurations, updated classes with effect calls.
```

**Test:** Game looks polished with satisfying visual feedback for all actions.

---

## PHASE 17: Menu & Save

```
Read GAME_SPEC.md for full context.

PHASE 17: Main Menu & Persistence (Babylon.js / HTML)

1. Create src/ui/MainMenuUI.js:
   - Can be Babylon.js GUI or HTML overlay
   - HTML approach (simpler):
     - Create menu HTML elements in index.html (hidden by default)
     - Show/hide with CSS/JavaScript
   - Menu contents:
     - Game title: "ENEMY EYES" (or chosen name like "GAZE")
     - "PLAY" button - starts game
     - "HIGH SCORE: 0" display
     - "HIGHEST WAVE: 0" display
     - "QUIT" button (closes tab or shows "Thanks for playing")
   - Background: Dark overlay, maybe animated particles or arena preview
   - Methods: show(), hide(), updateHighScore(score, wave)

2. Create src/gameflow/SaveManager.js:
   - Uses localStorage for persistence
   - Methods:
     - saveHighScore(score, wave) - saves if better than existing
     - loadHighScore() - returns {score, wave} or defaults
     - clearData() - resets saved data
   - Data structure in localStorage:
     - 'enemyEyes_highScore': number
     - 'enemyEyes_highWave': number

3. Update GameOverUI.js:
   - Check if new high score achieved
   - If new high score: show "NEW HIGH SCORE!" celebration text
   - Buttons:
     - "PLAY AGAIN" - restarts game
     - "MAIN MENU" - goes back to menu
   - On game over, call SaveManager.saveHighScore()

4. Update GameManager.js:
   - Game states: 'menu', 'playing', 'paused', 'gameOver'
   - startGame() - hides menu, initializes game, starts wave 1
   - returnToMenu() - cleans up game, shows main menu
   - On game over: check and save high score

5. Create src/ui/PauseMenuUI.js:
   - Press Escape to pause during gameplay
   - Pauses game loop (don't update enemies, player, etc.)
   - Shows overlay with:
     - "PAUSED" title
     - "RESUME" button - continues game
     - "RESTART" button - restarts from wave 1
     - "MAIN MENU" button - returns to menu
     - "QUIT" button
   - Methods: show(), hide(), isPaused()

6. Update InputManager.js:
   - Escape key toggles pause menu
   - When paused, ignore gameplay inputs

7. Update Game.js / main game loop:
   - Check pause state before updating
   - When paused, only update pause menu

8. Update index.html:
   - Add HTML structure for menus (or create dynamically)
   - Menu container div
   - Pause menu container div

9. Flow:
   - Game loads → Main Menu shows
   - Click Play → Menu hides, game starts
   - Press Escape → Pause menu
   - Die → Game Over screen with high score check
   - Click Main Menu → Back to main menu

Test criteria:
- Game starts showing main menu
- Click Play, game starts
- Escape pauses the game
- Can resume, restart, or go to menu from pause
- Die, see game over with score
- If new high score, celebration message
- Return to menu, high score is displayed
- Close browser, reopen, high score persists

Output: MainMenuUI.js, SaveManager.js, PauseMenuUI.js, updated GameOverUI, GameManager, index.html.
```

**Test:** Complete menu flow with pause functionality and persistent high scores.

---

## PHASE 18: Final Polish & Balance

```
Read GAME_SPEC.md for full context.

PHASE 18: Final Polish (Babylon.js)

1. Balance Pass - Review and adjust all numbers:

   Player:
   - Health: 100 (keep)
   - Shield: 50 (keep)
   - Move speed: 5 (test if feels right)
   - Sprint speed: 8 (test if feels right)

   Weapons - adjust for good feel:
   - Pistol: 25 damage, 400ms fire rate
   - Rifle: 35 damage, 150ms fire rate, 30 ammo
   - Shotgun: 15×6 damage, 800ms fire rate, 8 ammo
   - SMG: 15 damage, 80ms fire rate, 45 ammo

   Enemies - adjust for difficulty curve:
   - Grunt: 50 HP, speed 4, 10 damage
   - Soldier: 100 HP, speed 3, 10 damage, 1.5s attack rate
   - Sniper: 75 HP, speed 2, 25 damage, 3s attack rate
   - Heavy: 200 HP, speed 2, 25 damage
   - Boss: 500 HP

   Abilities - adjust cooldowns:
   - Dash: 8 sec cooldown
   - Flashbang: 15 sec cooldown, 3 sec stun
   - Fire Wall: 20 sec cooldown, 5 sec duration, 20 dps
   - Ultimate: 10 kills to charge, 100 damage

   Economy - adjust for progression feel:
   - Kills give appropriate credits
   - Items priced so player can buy ~1-2 things per wave

   Waves - test difficulty curve waves 1-15:
   - Early waves should feel easy
   - Mid waves challenging
   - Wave 10 boss should feel epic
   - Post-boss waves harder

2. Bug Fixes - Check for common issues:
   - Null reference errors (check all object references)
   - Camera never loses target (always has fallback)
   - UI always updates correctly
   - Abilities work in all situations
   - Enemies don't get stuck on obstacles
   - Player can't escape arena
   - Sounds don't overlap badly
   - Performance is smooth (check frame rate)

3. Quality of Life improvements:

   Create src/ui/TutorialHints.js:
   - Shows control hints on first play:
     - "WASD - Move"
     - "Mouse - Aim"
     - "Click - Shoot"
     - "Q E C - Abilities"
     - "1-4 - Switch Weapons"
   - Fades out after 10 seconds or first input
   - Only shows once (save flag in localStorage)

   Other improvements:
   - Auto-reload when magazine empty and trigger pulled
   - Ammo warning when low (< 25%): flash ammo counter
   - Better crosshair: changes color on enemy hover
   - Enemy health bars (small bar above each enemy)
   - Damage numbers floating up when hitting enemies (optional)
   - Kill feed (optional): "Enemy Killed +100" messages

4. Performance optimizations:
   - Object pooling for bullets/particles if needed
   - Dispose unused meshes properly
   - Limit max particles
   - Check for memory leaks

5. Final Checklist:
   - [ ] Player movement smooth
   - [ ] All weapons work correctly
   - [ ] All abilities work correctly
   - [ ] All enemy types behave correctly
   - [ ] Boss fight complete with all attacks
   - [ ] Wave progression smooth 1-15+
   - [ ] Buy system works
   - [ ] All sounds play
   - [ ] All visual effects work
   - [ ] HUD displays all info correctly
   - [ ] Main menu works
   - [ ] Pause menu works
   - [ ] Game over works
   - [ ] High score saves and loads
   - [ ] No major bugs or crashes
   - [ ] Performance acceptable (30+ FPS)

6. Create final build:
   - Run `npm run build`
   - Test built version
   - Ready to deploy to itch.io or web host!

Output: List of all balance changes made, bugs fixed, QoL features added, and final verification that all systems work.
```

**Test:** Complete, polished, balanced, bug-free game ready to share!

---

# PART 3: TROUBLESHOOTING PROMPTS

Use these when things go wrong:

## When Something Breaks

```
I'm getting this error in the browser console: [PASTE ERROR MESSAGE]

This is happening when: [DESCRIBE WHEN IT HAPPENS]

Here's the relevant code: [PASTE CODE]

Please fix this issue.
```

## When Feature Doesn't Work

```
The [FEATURE NAME] isn't working correctly.

Expected behavior: [WHAT SHOULD HAPPEN]
Actual behavior: [WHAT IS HAPPENING]

Here's the current code for this feature: [PASTE CODE]

Please identify and fix the problem.
```

## When You Need to Undo

```
The last change broke something. 

Before the change, [WHAT WORKED] was working.
After the change, [WHAT'S BROKEN] stopped working.

Please help me revert and try a different approach.
```

## Babylon.js Specific Issues

```
I'm having trouble with [Babylon.js feature like physics/particles/GUI].

I want to: [DESCRIBE GOAL]
Current code: [PASTE CODE]
What's happening: [DESCRIBE PROBLEM]

Please help me fix this Babylon.js issue.
```

---

# PART 4: DEPLOYMENT

## Hosting Your Game (Free Options)

### Option 1: itch.io (Recommended for games)
1. Run `npm run build`
2. Create account at itch.io
3. Create new project → HTML game
4. Upload the `dist` folder contents as ZIP
5. Share link with friends!

### Option 2: Netlify
1. Run `npm run build`
2. Go to netlify.com
3. Drag & drop `dist` folder
4. Get instant URL

### Option 3: GitHub Pages
1. Push code to GitHub
2. Enable Pages in repo settings
3. Deploy from `dist` folder

### Option 4: Vercel
1. Connect GitHub repo
2. Auto-deploys on push
3. Free hosting

---

# PART 5: TIME ESTIMATE

| Phases | Content | Time |
|--------|---------|------|
| 1-5 | Core gameplay | 3-5 days |
| 6-10 | Waves & economy | 3-4 days |
| 11-14 | Content expansion | 4-5 days |
| 15-18 | Polish & menus | 3-4 days |

**Total: 2-3 weeks** with regular work sessions

---

# TIPS FOR SUCCESS

1. **Test after every phase** - Run `npm run dev` and check browser
2. **Use browser console** - F12 to see errors and debug
3. **Save working versions** - Use git or copy your project folder
4. **One thing at a time** - Don't combine phases
5. **Read error messages** - Copy them exactly to Claude Code
6. **Check Babylon.js docs** - https://doc.babylonjs.com for reference
7. **Have fun!** - This is a learning experience with your son

---

# QUICK REFERENCE: BABYLON.JS BASICS

```javascript
// Create scene
const scene = new BABYLON.Scene(engine);

// Create mesh
const box = BABYLON.MeshBuilder.CreateBox("box", {size: 1}, scene);

// Position
box.position = new BABYLON.Vector3(x, y, z);

// Material
const material = new BABYLON.StandardMaterial("mat", scene);
material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
box.material = material;

// Camera
const camera = new BABYLON.FreeCamera("cam", new BABYLON.Vector3(0, 5, -10), scene);
camera.setTarget(BABYLON.Vector3.Zero());

// Light
const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

// Raycasting
const ray = new BABYLON.Ray(origin, direction, length);
const hit = scene.pickWithRay(ray);

// Input
scene.onKeyboardObservable.add((kbInfo) => { });
scene.onPointerObservable.add((pointerInfo) => { });

// Game loop
engine.runRenderLoop(() => {
    scene.render();
});
```

Good luck building Enemy Eyes! 🎮
