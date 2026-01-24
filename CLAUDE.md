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

