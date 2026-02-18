/**
 * Game.js - Main game class that initializes and manages the game world.
 */
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';

// Camera system
import { PlayerCamera } from '../camera/PlayerCamera.js';

// Combat
import { DamageSystem } from '../combat/DamageSystem.js';

// Player
import { WeaponInventory } from '../player/WeaponInventory.js';
import { AbilitySystem } from '../player/AbilitySystem.js';

// Enemy system
import { EnemySpawner } from '../enemies/EnemySpawner.js';

// Game flow
import { GameManager } from '../gameflow/GameManager.js';

// Settings
import { Settings } from './Settings.js';

// Audio
import { AudioManager } from '../audio/AudioManager.js';

// Effects
import { EffectsManager } from '../effects/EffectsManager.js';

// Asset loading
import { AssetLoader } from './AssetLoader.js';

export class Game {
    constructor(engine, canvas) {
        this.engine = engine;
        this.canvas = canvas;
        this.scene = new Scene(engine);
        this.scene.clearColor = new Color4(0.1, 0.1, 0.15, 1);

        this.lastTime = performance.now();
        this.keys = {};
        this.mouse = { left: false, right: false };
        this.moveSpeed = 5;
        this.sprintSpeed = 8;
        this.playerRadius = 0.5;

        // Settings
        this.settings = Settings.getInstance();

        // Audio
        this.audioManager = new AudioManager();
        this.setupAudio();

        // Effects
        this.effectsManager = new EffectsManager(this.scene);

        // Damage system
        this.damageSystem = new DamageSystem();

        // HUD elements
        this.ammoDisplay = document.getElementById('ammo');
        this.healthDisplay = document.getElementById('health');

        // Define obstacles for collision
        this.obstacles = [
            { x: 0, z: 0, hw: 1, hd: 1 },
            { x: -10, z: 8, hw: 1.5, hd: 1.5 },
            { x: 12, z: -5, hw: 2, hd: 1 },
            { x: -8, z: -12, hw: 1, hd: 2 },
        ];

        // Spawn points at arena edges
        this.spawnPoints = [
            new Vector3(0, 0, 22),
            new Vector3(0, 0, -22),
            new Vector3(22, 0, 0),
            new Vector3(-22, 0, 0),
        ];

        // Initialize asset loader
        this.assetLoader = AssetLoader.getInstance(this.scene);

        // Setup input
        this.setupInput();

        // Build scene
        this.setupLighting();
        this.createArena();
        this.createPlayer();
        this.setupPlayerCamera();

        // Start async asset preloading (models will replace placeholders when ready)
        this.preloadAssets();

        // Create weapon
        this.setupWeapon();

        // Setup abilities
        this.setupAbilities();

        // Setup enemy spawner
        this.setupSpawner();

        // Setup game manager
        this.setupGameManager();

        // Initialize HUD with current control scheme
        if (this.gameManager.hud) {
            this.gameManager.hud.updateControlScheme(this.settings.getControlScheme());
        }

        // Game starts on main menu - player clicks Play to start

        console.log('=== Enemy Eyes ===');
        console.log('Click PLAY to start the game!');
    }

    /**
     * Preload 3D model assets. Non-blocking — game works with procedural
     * fallbacks while assets load.
     */
    async preloadAssets() {
        try {
            await this.assetLoader.preloadAll();
            console.log('[Game] Assets preloaded successfully');
        } catch (err) {
            console.warn('[Game] Asset preload failed, using procedural meshes:', err.message);
        }
    }

    /**
     * Setup audio system - initialize on first user interaction.
     */
    setupAudio() {
        // Audio context must be started after user interaction
        const initAudio = async () => {
            await this.audioManager.init();
            // Remove listeners after first interaction
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('keydown', initAudio, { once: true });
    }

    setupInput() {
        document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.left = true;
            if (e.button === 2) this.mouse.right = true;
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 2) this.mouse.right = false;
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setupWeapon() {
        this.weaponInventory = new WeaponInventory({
            onWeaponSwitch: (weapon, slot) => this.onWeaponSwitch(weapon, slot),
            onFire: () => this.onWeaponFire(),
            onReload: () => this.updateHUD(),
            onReloadComplete: () => this.updateHUD(),
            onEmpty: () => console.log('Click! Out of ammo - press R to reload'),
        });

        this.updateHUD();
    }

    onWeaponSwitch(weapon, slot) {
        console.log(`Switched to ${weapon.name} (slot ${slot})`);
        this.updateHUD();
    }

    getCurrentWeapon() {
        return this.weaponInventory.getCurrentWeapon();
    }

    setupAbilities() {
        // Track last movement direction for abilities
        this.lastMoveDirection = new Vector3(0, 0, 1);

        this.abilitySystem = new AbilitySystem({
            getPlayerPosition: () => this.getPlayerPosition(),
            getPlayerDirection: () => this.lastMoveDirection.clone(),
            setPlayerPosition: (pos) => this.setPlayerPosition(pos),
            scene: this.scene,
            getEnemies: () => this.getEnemies(),
            playerHealth: null, // Will be set after GameManager creates it
            onUltimateReady: () => {
                if (this.gameManager && this.gameManager.hud) {
                    this.gameManager.hud.showMessage('ULTIMATE READY!', 2000);
                }
            },
            onAbilityUsed: (ability) => {
                console.log(`Used ability: ${ability.name}`);
            },
        });
    }

    setPlayerPosition(pos) {
        if (this.playerNode) {
            this.playerNode.position.x = pos.x;
            this.playerNode.position.z = pos.z;
        }
    }

    getEnemies() {
        if (this.spawner) {
            return this.spawner.getAliveEnemies();
        }
        return [];
    }

    setupSpawner() {
        this.spawner = new EnemySpawner({
            scene: this.scene,
            spawnPoints: this.spawnPoints,
            getPlayerPosition: () => this.getPlayerPosition(),
            onEnemyCreated: (enemy) => this.gameManager?.onEnemyCreated(enemy),
            onEnemyDeath: (enemy) => this.gameManager?.onEnemyKilled(enemy),
            onAllEnemiesDead: () => this.gameManager?.onWaveComplete(),
        });
    }

    setupGameManager() {
        this.gameManager = new GameManager({
            scene: this.scene,
            spawner: this.spawner,
            camera: this.playerCamera,
            damageSystem: this.damageSystem,
            getWeapon: () => this.getCurrentWeapon(),
            getWeaponInventory: () => this.weaponInventory,
            abilitySystem: this.abilitySystem,
        });

        // Set player health reference in ability system
        if (this.abilitySystem && this.gameManager.playerHealth) {
            this.abilitySystem.playerHealth = this.gameManager.playerHealth;
        }
    }

    onWeaponFire() {
        this.createMuzzleFlash();
        this.updateHUD();

        // Play weapon sound
        const weapon = this.getCurrentWeapon();
        if (weapon && this.audioManager) {
            const soundName = `shoot_${weapon.name.toLowerCase()}`;
            this.audioManager.playSound(soundName);
        }
    }

    createMuzzleFlash() {
        const position = this.playerNode.position.add(new Vector3(0, 1, 0));
        this.effectsManager.createMuzzleFlash(position);
    }

    createHitEffect(point) {
        this.effectsManager.createHitSpark(point);
    }

    shoot() {
        const weapon = this.getCurrentWeapon();
        if (!weapon) return;

        if (!weapon.canFire()) {
            if (weapon.currentAmmo <= 0) {
                weapon.reload();
            }
            return;
        }

        const camera = this.playerCamera.getCamera();
        const playerPos = this.playerNode.position.clone();
        playerPos.y = 1;

        const pickResult = this.scene.pick(
            this.engine.getRenderWidth() / 2,
            this.engine.getRenderHeight() / 2
        );

        let aimPoint;
        if (pickResult.hit) {
            aimPoint = pickResult.pickedPoint;
        } else {
            const ray = this.scene.createPickingRay(
                this.engine.getRenderWidth() / 2,
                this.engine.getRenderHeight() / 2,
                null,
                camera
            );
            aimPoint = ray.origin.add(ray.direction.scale(100));
        }

        const direction = aimPoint.subtract(playerPos).normalize();

        weapon.fire(playerPos, direction, this.scene, (hit, damage, isHeadshot, aoeData) => {
            // Handle AOE (rocket launcher)
            if (aoeData && aoeData.isAOE) {
                const hitCount = this.damageSystem.processAOE(aoeData.center, damage, aoeData.blastRadius);
                if (hitCount > 0) {
                    this.showHitMarker();
                    this.triggerScreenShake(0.5);
                }
                // Create explosion effect
                this.effectsManager.createExplosion(aoeData.center);
                return;
            }

            const enemyHit = this.damageSystem.processHit(hit, damage);
            if (enemyHit) {
                this.createHitEffect(hit.pickedPoint);
                this.showHitMarker();

                if (isHeadshot) {
                    this.showHeadshotMarker();
                    this.triggerScreenShake(0.15);
                    if (this.gameManager && this.gameManager.hud) {
                        this.gameManager.hud.showMessage('HEADSHOT!', 800);
                    }
                    if (this.audioManager) {
                        this.audioManager.playSound('headshot');
                    }
                }
            }
        });
    }

    showHitMarker() {
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.style.transform = 'translate(-50%, -50%) scale(1.3)';
            crosshair.style.borderColor = 'white';
            setTimeout(() => {
                crosshair.style.transform = 'translate(-50%, -50%) scale(1)';
                crosshair.style.borderColor = '';
            }, 100);
        }
    }

    showHeadshotMarker() {
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.style.transform = 'translate(-50%, -50%) scale(1.6)';
            crosshair.style.borderColor = '#ff4444';
            setTimeout(() => {
                crosshair.style.transform = 'translate(-50%, -50%) scale(1)';
                crosshair.style.borderColor = '';
            }, 200);
        }
    }

    /**
     * Trigger screen shake effect.
     * @param {number} intensity - Shake intensity (0-1)
     */
    triggerScreenShake(intensity = 0.3) {
        const camera = this.playerCamera.getCamera();
        if (!camera) return;

        const originalPos = camera.position.clone();
        const shakeCount = 6;
        let step = 0;

        const shakeInterval = setInterval(() => {
            step++;
            if (step >= shakeCount) {
                clearInterval(shakeInterval);
                return;
            }
            const offsetX = (Math.random() - 0.5) * intensity * 2;
            const offsetY = (Math.random() - 0.5) * intensity * 2;
            camera.position.x += offsetX;
            camera.position.y += offsetY;
        }, 30);
    }

    updateHUD() {
        const weapon = this.getCurrentWeapon();
        if (this.ammoDisplay && weapon) {
            this.ammoDisplay.textContent = weapon.getAmmoString();
        }
        // Also update game manager HUD if available
        if (this.gameManager && this.gameManager.hud && weapon) {
            this.gameManager.hud.updateWeapon(
                weapon.name,
                weapon.getAmmoString(),
                weapon.currentAmmo,
                weapon.maxAmmo
            );
        }
    }

    setupPlayerCamera() {
        this.playerCamera = new PlayerCamera(
            this.scene,
            () => this.getPlayerPosition()
        );
    }

    createPlayer() {
        this.playerNode = new TransformNode('player', this.scene);
        this.playerNode.position = new Vector3(-5, 0, -5);

        // Try loaded 3D model
        const loader = AssetLoader.getInstance();
        if (loader && loader.hasAsset('player')) {
            const model = loader.createInstance('player', 'playerBody');
            if (model) {
                model.parent = this.playerNode;
                this.playerHealth = 100;
                return;
            }
        }

        // Fallback: procedural mesh
        const body = MeshBuilder.CreateCylinder('playerBody', { height: 2, diameter: 1 }, this.scene);
        body.parent = this.playerNode;
        body.position.y = 1;

        const mat = new StandardMaterial('playerMat', this.scene);
        mat.diffuseColor = new Color3(0.2, 0.6, 1.0);
        mat.emissiveColor = new Color3(0.15, 0.25, 0.4);
        body.material = mat;

        const indicator = MeshBuilder.CreateBox('indicator', { width: 0.3, height: 0.3, depth: 0.6 }, this.scene);
        indicator.parent = this.playerNode;
        indicator.position = new Vector3(0, 1, 0.7);
        const indMat = new StandardMaterial('indMat', this.scene);
        indMat.diffuseColor = new Color3(1, 0.8, 0.2);
        indicator.material = indMat;

        this.playerHealth = 100;
    }

    getPlayerPosition() {
        return this.playerNode.position.clone();
    }

    setupLighting() {
        const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
        ambient.intensity = 0.6;
        const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), this.scene);
        dir.intensity = 0.8;
    }

    createArena() {
        const ground = MeshBuilder.CreateGround('ground', { width: 50, height: 50 }, this.scene);
        const groundMat = new StandardMaterial('groundMat', this.scene);
        groundMat.diffuseColor = new Color3(0.3, 0.3, 0.35);
        ground.material = groundMat;

        const wallMat = new StandardMaterial('wallMat', this.scene);
        wallMat.diffuseColor = new Color3(0.4, 0.35, 0.3);

        const walls = [
            { pos: [0, 2.5, 25], size: [50, 5, 1] },
            { pos: [0, 2.5, -25], size: [50, 5, 1] },
            { pos: [25, 2.5, 0], size: [1, 5, 50] },
            { pos: [-25, 2.5, 0], size: [1, 5, 50] },
        ];
        walls.forEach((w, i) => {
            const wall = MeshBuilder.CreateBox(`wall${i}`, { width: w.size[0], height: w.size[1], depth: w.size[2] }, this.scene);
            wall.position = new Vector3(...w.pos);
            wall.material = wallMat;
        });

        // Pillar - use loaded model or fallback
        const loader = AssetLoader.getInstance();
        let pillar;
        if (loader && loader.hasAsset('env_pillar')) {
            pillar = loader.createInstance('env_pillar', 'pillar');
            pillar.position = new Vector3(0, 0, 0);
        } else {
            pillar = MeshBuilder.CreateBox('pillar', { width: 2, height: 5, depth: 2 }, this.scene);
            pillar.position = new Vector3(0, 2.5, 0);
            const pillarMat = new StandardMaterial('pillarMat', this.scene);
            pillarMat.diffuseColor = new Color3(0.35, 0.35, 0.4);
            pillar.material = pillarMat;
        }

        // Crates - use loaded model or fallback
        const cratePositions = [
            new Vector3(-10, 0, 8),
            new Vector3(12, 0, -5),
            new Vector3(-8, 0, -12),
        ];
        const crateMat = new StandardMaterial('crateMat', this.scene);
        crateMat.diffuseColor = new Color3(0.5, 0.4, 0.3);

        cratePositions.forEach((pos, i) => {
            let crate;
            if (loader && loader.hasAsset('env_crate')) {
                crate = loader.createInstance('env_crate', `crate${i + 1}`);
                crate.position = pos;
                crate.scaling.setAll(3); // Scale up for cover
            } else {
                const sizes = [
                    { width: 3, height: 3, depth: 3 },
                    { width: 4, height: 2, depth: 2 },
                    { width: 2, height: 2, depth: 4 },
                ];
                crate = MeshBuilder.CreateBox(`crate${i + 1}`, sizes[i], this.scene);
                crate.position = pos.clone();
                crate.position.y = sizes[i].height / 2;
                crate.material = crateMat;
            }
        });

        const spawnMat = new StandardMaterial('spawnMat', this.scene);
        spawnMat.diffuseColor = new Color3(0.8, 0.2, 0.2);
        spawnMat.alpha = 0.5;

        this.spawnPoints.forEach((pos, i) => {
            const disc = MeshBuilder.CreateDisc(`spawn${i}`, { radius: 1.5 }, this.scene);
            disc.position = new Vector3(pos.x, 0.05, pos.z);
            disc.rotation.x = Math.PI / 2;
            disc.material = spawnMat;
        });
    }

    update() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        // Get current game state
        const gameState = this.gameManager ? this.gameManager.getState() : 'menu';

        // If on main menu, just render - no input processing
        if (gameState === 'menu') {
            return;
        }

        // Escape key - toggle pause or close buy menu
        if (this.keys['Escape']) {
            this.keys['Escape'] = false;
            if (this.gameManager) {
                // If buy menu is open, close it
                if (this.gameManager.isBuyMenuOpen()) {
                    this.gameManager.closeBuyMenu();
                } else if (gameState === 'playing' || gameState === 'paused') {
                    // Toggle pause
                    this.gameManager.togglePause();
                }
            }
        }

        // If game over, no input processing
        if (gameState === 'gameOver') {
            return;
        }

        // If paused (pause menu), only allow ESC to resume
        if (gameState === 'paused') {
            return;
        }

        // Check if game is paused (buy menu open)
        const isPaused = this.gameManager && this.gameManager.isPaused;

        // Open buy menu (B key) - works even when paused
        if (this.keys['KeyB']) {
            this.keys['KeyB'] = false;
            if (this.gameManager) {
                this.gameManager.openBuyMenu();
            }
        }

        // Skip gameplay input if paused (buy menu)
        if (isPaused) {
            // Still update game manager for timer countdown
            this.gameManager.update(dt);
            return;
        }

        // Player movement
        this.updatePlayerMovement(dt);

        // Shooting with SPACE
        if (this.keys['Space']) {
            this.shoot();
        }

        // Reload
        if (this.keys['KeyR']) {
            this.keys['KeyR'] = false;
            const weapon = this.getCurrentWeapon();
            if (weapon) {
                weapon.reload();
                if (this.audioManager) {
                    this.audioManager.playSound('reload');
                }
            }
        }

        // Weapon switching (number keys 1-4)
        if (this.keys['Digit1']) {
            this.keys['Digit1'] = false;
            this.weaponInventory.switchWeapon(1);
            this.updateHUD();
        }
        if (this.keys['Digit2']) {
            this.keys['Digit2'] = false;
            this.weaponInventory.switchWeapon(2);
            this.updateHUD();
        }
        if (this.keys['Digit3']) {
            this.keys['Digit3'] = false;
            this.weaponInventory.switchWeapon(3);
            this.updateHUD();
        }
        if (this.keys['Digit4']) {
            this.keys['Digit4'] = false;
            this.weaponInventory.switchWeapon(4);
            this.updateHUD();
        }
        if (this.keys['Digit5']) {
            this.keys['Digit5'] = false;
            this.weaponInventory.switchWeapon(5);
            this.updateHUD();
        }
        if (this.keys['Digit6']) {
            this.keys['Digit6'] = false;
            this.weaponInventory.switchWeapon(6);
            this.updateHUD();
        }

        // Toggle control scheme (T key)
        if (this.keys['KeyT']) {
            this.keys['KeyT'] = false;
            const newScheme = this.settings.toggleControlScheme();
            const message = newScheme === 'arrows' ? 'Controls: Arrow Keys' : 'Controls: WASD';
            if (this.gameManager && this.gameManager.hud) {
                this.gameManager.hud.showMessage(message, 1500);
                this.gameManager.hud.updateControlScheme(newScheme);
            }
            console.log(message);
        }

        // Ability keys (Q, E, C, X)
        if (this.keys['KeyQ']) {
            this.keys['KeyQ'] = false;
            this.abilitySystem.useAbility('KeyQ');
        }
        if (this.keys['KeyE']) {
            this.keys['KeyE'] = false;
            this.abilitySystem.useAbility('KeyE');
        }
        if (this.keys['KeyC']) {
            this.keys['KeyC'] = false;
            this.abilitySystem.useAbility('KeyC');
        }
        if (this.keys['KeyX']) {
            this.keys['KeyX'] = false;
            this.abilitySystem.useAbility('KeyX');
        }

        // Update weapon inventory (for reload timers)
        this.weaponInventory.update();

        // Update ability system (cooldowns)
        this.abilitySystem.update(dt);

        // Update game manager (which updates spawner and enemies)
        this.gameManager.update(dt);

        // Update abilities HUD
        if (this.gameManager.hud) {
            this.gameManager.hud.updateAbilities(
                this.abilitySystem.getAbilitiesInfo(),
                this.abilitySystem.getUltimateCharge()
            );
        }

        // Update minimap
        if (this.gameManager && this.gameManager.hud) {
            const enemies = this.getEnemies();
            this.gameManager.hud.updateMinimap(this.getPlayerPosition(), enemies);
        }

        // Update camera
        this.playerCamera.update(dt);
    }

    updatePlayerMovement(dt) {
        let mx = 0, mz = 0;

        const scheme = this.settings.getControlScheme();

        if (scheme === 'wasd') {
            // WASD controls
            if (this.keys['KeyW']) mz = 1;
            if (this.keys['KeyS']) mz = -1;
            if (this.keys['KeyA']) mx = -1;
            if (this.keys['KeyD']) mx = 1;
        } else {
            // Arrow key controls (default)
            if (this.keys['ArrowUp']) mz = 1;
            if (this.keys['ArrowDown']) mz = -1;
            if (this.keys['ArrowLeft']) mx = -1;
            if (this.keys['ArrowRight']) mx = 1;
        }

        if (mx === 0 && mz === 0) return;

        const len = Math.sqrt(mx * mx + mz * mz);
        mx /= len;
        mz /= len;

        // Track movement direction for abilities
        this.lastMoveDirection.x = mx;
        this.lastMoveDirection.z = mz;

        // Use agent stats if available
        const agentStats = this.gameManager?.agentStats;
        const baseSpeed = agentStats ? agentStats.moveSpeed : this.moveSpeed;
        const sprintSpd = agentStats ? agentStats.sprintSpeed : this.sprintSpeed;
        const speed = this.keys['ShiftLeft'] ? sprintSpd : baseSpeed;
        const dx = mx * speed * dt;
        const dz = mz * speed * dt;

        const pos = this.playerNode.position;
        const r = this.playerRadius;

        let newX = pos.x + dx;
        let newZ = pos.z + dz;

        newX = Math.max(-24 + r, Math.min(24 - r, newX));
        newZ = Math.max(-24 + r, Math.min(24 - r, newZ));

        if (!this.collidesWithAny(newX, newZ)) {
            pos.x = newX;
            pos.z = newZ;
        } else {
            let slideX = Math.max(-24 + r, Math.min(24 - r, pos.x + dx));
            if (!this.collidesWithAny(slideX, pos.z)) {
                pos.x = slideX;
            }

            let slideZ = Math.max(-24 + r, Math.min(24 - r, pos.z + dz));
            if (!this.collidesWithAny(pos.x, slideZ)) {
                pos.z = slideZ;
            }
        }
    }

    collidesWithAny(x, z) {
        const r = this.playerRadius;
        for (const obs of this.obstacles) {
            if (x + r > obs.x - obs.hw && x - r < obs.x + obs.hw &&
                z + r > obs.z - obs.hd && z - r < obs.z + obs.hd) {
                return true;
            }
        }
        return false;
    }

    render() {
        this.scene.render();
    }
}
