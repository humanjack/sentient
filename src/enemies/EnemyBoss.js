/**
 * EnemyBoss.js - Mini-Boss "Watcher" with multiple attacks and drone camera.
 * From GAME_SPEC: Health 500, Attacks: Laser beam, spawn minions, ground slam.
 * Has a drone camera with priority 0 for cinematic overhead view.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { EnemyBase } from './EnemyBase.js';
import { CameraTarget } from '../camera/CameraTarget.js';
import { GameManager } from '../gameflow/GameManager.js';
import { AssetLoader } from '../core/AssetLoader.js';

export class EnemyBoss extends EnemyBase {
    /**
     * Create the Watcher boss.
     * @param {Scene} scene - Babylon.js scene
     * @param {Vector3} position - Starting position
     * @param {Object} options - Configuration options
     */
    constructor(scene, position, options = {}) {
        // Boss stats from GAME_SPEC
        super(scene, position, {
            maxHealth: 500,
            speed: 1.5,
            damage: 30,
            enemyType: 'boss',
            name: options.name || 'Watcher',
            onDeath: options.onDeath,
            getPlayerPosition: options.getPlayerPosition,
        });

        // Attack configurations
        this.attacks = {
            laser: { cooldown: 0, cooldownTime: 5, chargeTime: 1.5, isCharging: false, chargeTimer: 0 },
            minions: { cooldown: 0, cooldownTime: 15, lastSpawnCount: 0 },
            slam: { cooldown: 0, cooldownTime: 8, range: 5 }
        };

        // Drone for cinematic camera
        this.drone = null;
        this.droneCameraTarget = null;
        this.droneHeight = 8;
        this.droneOffset = new Vector3(0, this.droneHeight, 0);

        // Visual effects
        this.laserLine = null;
        this.laserTarget = null;

        // Spawner reference for minions
        this.spawner = options.spawner || null;

        // Callbacks for boss-specific events
        this.onBossHealthChanged = options.onBossHealthChanged || null;

        // Create the boss mesh
        this.createMesh();
        this.createDrone();
    }

    /**
     * Create the boss's visual representation.
     * Large purple box placeholder.
     */
    createMesh() {
        const loader = AssetLoader.getInstance();
        if (loader && loader.hasAsset('enemy_boss')) {
            const model = loader.createInstance('enemy_boss', `boss_${Date.now()}`);
            if (model) {
                model.position = this.position.clone();
                this.setMesh(model);
                return;
            }
        }

        // Fallback: procedural large purple box
        const body = MeshBuilder.CreateBox(
            `boss_${Date.now()}`,
            { width: 3, height: 4, depth: 3 },
            this.scene
        );
        body.position = this.position.clone();
        body.position.y = 2;

        const mat = new StandardMaterial('bossMat', this.scene);
        mat.diffuseColor = new Color3(0.5, 0.1, 0.6);
        mat.emissiveColor = new Color3(0.15, 0.03, 0.2);
        body.material = mat;

        for (let i = 0; i < 3; i++) {
            const eye = MeshBuilder.CreateSphere(`bossEye_${i}`, { diameter: 0.4 }, this.scene);
            eye.parent = body;
            eye.position = new Vector3(-0.6 + i * 0.6, 0.8, 1.4);
            const eyeMat = new StandardMaterial(`eyeMat_${i}`, this.scene);
            eyeMat.diffuseColor = new Color3(1, 0, 0.5);
            eyeMat.emissiveColor = new Color3(0.8, 0, 0.4);
            eye.material = eyeMat;
        }

        this.setMesh(body);
    }

    /**
     * Create the drone that provides cinematic camera view.
     */
    createDrone() {
        // Create drone mesh (small sphere floating above boss)
        this.drone = MeshBuilder.CreateSphere(
            'bossDrone',
            { diameter: 1 },
            this.scene
        );
        this.drone.position = this.mesh.position.clone();
        this.drone.position.y += this.droneHeight;

        // Drone material
        const droneMat = new StandardMaterial('droneMat', this.scene);
        droneMat.diffuseColor = new Color3(0.3, 0.3, 0.4);
        droneMat.emissiveColor = new Color3(0.1, 0.1, 0.15);
        this.drone.material = droneMat;

        // Add camera lens
        const lens = MeshBuilder.CreateCylinder(
            'droneLens',
            { diameter: 0.3, height: 0.2, tessellation: 12 },
            this.scene
        );
        lens.parent = this.drone;
        lens.position = new Vector3(0, -0.4, 0);
        lens.rotation.x = Math.PI / 2;

        const lensMat = new StandardMaterial('lensMat', this.scene);
        lensMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
        lensMat.emissiveColor = new Color3(0.2, 0, 0);
        lens.material = lensMat;

        // Create camera target for drone (priority 0 - highest)
        this.droneCameraTarget = new CameraTarget({
            mesh: this.drone,
            priority: 0, // Highest priority - boss drone takes over camera
            name: 'WatcherDrone',
            offset: new Vector3(0, 0, 0),
        });
    }

    /**
     * Get the drone camera target (priority 0).
     * @returns {CameraTarget}
     */
    getDroneCameraTarget() {
        return this.droneCameraTarget;
    }

    /**
     * Start laser beam attack.
     */
    startLaserAttack() {
        this.attacks.laser.isCharging = true;
        this.attacks.laser.chargeTimer = this.attacks.laser.chargeTime;
        this.laserTarget = this.getPlayerPosition().clone();
        this.createLaserWarning();
        console.log(`${this.cameraTarget.name} charging LASER BEAM!`);
    }

    /**
     * Create laser warning line.
     */
    createLaserWarning() {
        if (this.laserLine) {
            this.laserLine.dispose();
        }

        const myPos = this.mesh.position.clone();
        myPos.y += 1.5;

        this.laserLine = MeshBuilder.CreateLines(
            'bossLaserWarning',
            { points: [myPos, this.laserTarget] },
            this.scene
        );
        this.laserLine.color = new Color3(1, 0, 0);
    }

    /**
     * Fire the laser beam.
     */
    fireLaser() {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.playerHealth) {
            return;
        }

        // Check if player is near the laser path
        const playerPos = this.getPlayerPosition();
        const myPos = this.mesh.position.clone();
        myPos.y += 1.5;

        // Simple distance check to laser line
        const toPlayer = playerPos.subtract(myPos);
        const toTarget = this.laserTarget.subtract(myPos);
        const laserLength = toTarget.length();
        toTarget.normalize();

        const dot = Vector3.Dot(toPlayer, toTarget);
        const closest = myPos.add(toTarget.scale(Math.max(0, Math.min(dot, laserLength))));
        const distanceToLaser = playerPos.subtract(closest).length();

        // If player is within 2 units of laser path
        if (distanceToLaser < 2) {
            gameManager.playerHealth.takeDamage(this.attacks.laser.damage || 30);
            console.log(`${this.cameraTarget.name} LASER HIT for 30 damage!`);
        }

        // Create laser beam visual
        this.createLaserBeam();

        // Clean up
        if (this.laserLine) {
            this.laserLine.dispose();
            this.laserLine = null;
        }

        this.attacks.laser.isCharging = false;
        this.attacks.laser.cooldown = this.attacks.laser.cooldownTime;
    }

    /**
     * Create the actual laser beam visual.
     */
    createLaserBeam() {
        const myPos = this.mesh.position.clone();
        myPos.y += 1.5;

        // Create thick beam
        const direction = this.laserTarget.subtract(myPos);
        const length = direction.length();
        direction.normalize();

        const beam = MeshBuilder.CreateCylinder(
            'laserBeam',
            { diameter: 0.5, height: length, tessellation: 8 },
            this.scene
        );

        // Position at midpoint
        const midpoint = myPos.add(direction.scale(length / 2));
        beam.position = midpoint;

        // Rotate to point at target
        beam.lookAt(this.laserTarget);
        beam.rotation.x += Math.PI / 2;

        const beamMat = new StandardMaterial('beamMat', this.scene);
        beamMat.diffuseColor = new Color3(1, 0, 0);
        beamMat.emissiveColor = new Color3(1, 0.3, 0.3);
        beamMat.alpha = 0.8;
        beam.material = beamMat;

        // Fade out
        let alpha = 0.8;
        const fade = () => {
            alpha -= 0.15;
            beamMat.alpha = alpha;
            if (alpha <= 0) {
                beam.dispose();
            } else {
                setTimeout(fade, 50);
            }
        };
        setTimeout(fade, 100);
    }

    /**
     * Spawn minion grunts.
     */
    spawnMinions() {
        const count = 3;
        console.log(`${this.cameraTarget.name} spawning ${count} minions!`);

        // Get spawner from GameManager if not set
        if (!this.spawner) {
            const gameManager = GameManager.getInstance();
            if (gameManager && gameManager.spawner) {
                this.spawner = gameManager.spawner;
            }
        }

        if (this.spawner) {
            const myPos = this.mesh.position;
            for (let i = 0; i < count; i++) {
                // Spawn near boss
                const angle = (i / count) * Math.PI * 2;
                const offset = 4;
                const spawnPos = new Vector3(
                    myPos.x + Math.cos(angle) * offset,
                    0,
                    myPos.z + Math.sin(angle) * offset
                );
                this.spawner.spawnEnemy(spawnPos, 'grunt');
            }
        }

        // Visual effect
        this.showSpawnEffect();

        this.attacks.minions.cooldown = this.attacks.minions.cooldownTime;
    }

    /**
     * Show spawn effect.
     */
    showSpawnEffect() {
        const flash = MeshBuilder.CreateSphere(
            'spawnFlash',
            { diameter: 6 },
            this.scene
        );
        flash.position = this.mesh.position.clone();
        flash.position.y = 2;

        const flashMat = new StandardMaterial('flashMat', this.scene);
        flashMat.diffuseColor = new Color3(0.5, 0, 0.5);
        flashMat.emissiveColor = new Color3(0.8, 0, 0.8);
        flashMat.alpha = 0.5;
        flash.material = flashMat;

        // Expand and fade
        let scale = 1;
        const animate = () => {
            scale += 0.3;
            flash.scaling = new Vector3(scale, scale, scale);
            flashMat.alpha -= 0.1;
            if (flashMat.alpha <= 0) {
                flash.dispose();
            } else {
                setTimeout(animate, 50);
            }
        };
        setTimeout(animate, 50);
    }

    /**
     * Ground slam attack.
     */
    groundSlam() {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.playerHealth) {
            return;
        }

        console.log(`${this.cameraTarget.name} GROUND SLAM!`);

        // Check if player in range
        const playerPos = this.getPlayerPosition();
        const distance = this.mesh.position.subtract(playerPos).length();

        if (distance <= this.attacks.slam.range) {
            gameManager.playerHealth.takeDamage(40);
            console.log('Ground slam hit player for 40 damage!');

            // Knockback player
            const direction = playerPos.subtract(this.mesh.position);
            direction.y = 0;
            direction.normalize();

            // Would need to move player - simplified visual feedback
        }

        // Visual effect - shockwave
        this.createShockwave();

        this.attacks.slam.cooldown = this.attacks.slam.cooldownTime;
    }

    /**
     * Create shockwave visual.
     */
    createShockwave() {
        const ring = MeshBuilder.CreateTorus(
            'shockwave',
            { diameter: 2, thickness: 0.5, tessellation: 32 },
            this.scene
        );
        ring.position = this.mesh.position.clone();
        ring.position.y = 0.2;
        ring.rotation.x = Math.PI / 2;

        const ringMat = new StandardMaterial('ringMat', this.scene);
        ringMat.diffuseColor = new Color3(1, 0.3, 0);
        ringMat.emissiveColor = new Color3(0.5, 0.1, 0);
        ringMat.alpha = 0.8;
        ring.material = ringMat;

        // Expand and fade
        let scale = 1;
        const maxScale = 6;
        const animate = () => {
            scale += 0.5;
            ring.scaling = new Vector3(scale, scale, 1);
            ringMat.alpha = 0.8 * (1 - scale / maxScale);
            if (scale >= maxScale) {
                ring.dispose();
            } else {
                setTimeout(animate, 50);
            }
        };
        setTimeout(animate, 50);
    }

    /**
     * Override takeDamage to notify listeners.
     */
    takeDamage(amount) {
        super.takeDamage(amount);

        if (this.onBossHealthChanged) {
            this.onBossHealthChanged(this.health, this.maxHealth);
        }
    }

    /**
     * Update boss AI.
     * @param {number} deltaTime
     */
    update(deltaTime) {
        super.update(deltaTime);

        if (!this.isAlive || !this.mesh) return;

        // Update drone position to follow boss
        if (this.drone) {
            this.drone.position.x = this.mesh.position.x;
            this.drone.position.z = this.mesh.position.z;
            this.drone.position.y = this.mesh.position.y + this.droneHeight;
        }

        // Skip AI if stunned
        if (this.isStunned) {
            // Cancel laser if stunned
            if (this.attacks.laser.isCharging) {
                this.attacks.laser.isCharging = false;
                if (this.laserLine) {
                    this.laserLine.dispose();
                    this.laserLine = null;
                }
            }
            if (this.mesh.material) {
                this.mesh.material.emissiveColor = new Color3(0.5, 0.5, 0.1);
            }
            return;
        } else if (this.mesh.material) {
            this.mesh.material.emissiveColor = new Color3(0.15, 0.03, 0.2);
        }

        // Update cooldowns
        for (const attack of Object.values(this.attacks)) {
            if (attack.cooldown > 0) {
                attack.cooldown -= deltaTime;
            }
        }

        const playerPos = this.getPlayerPosition();
        const myPos = this.mesh.position;
        const direction = new Vector3(
            playerPos.x - myPos.x,
            0,
            playerPos.z - myPos.z
        );
        const distance = direction.length();
        direction.normalize();

        // Always face player
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;

        // Handle charging laser
        if (this.attacks.laser.isCharging) {
            this.attacks.laser.chargeTimer -= deltaTime;
            // Update laser warning line
            if (this.laserLine) {
                this.laserLine.dispose();
                this.createLaserWarning();
            }
            if (this.attacks.laser.chargeTimer <= 0) {
                this.fireLaser();
            }
            return; // Don't move while charging
        }

        // Choose attack based on situation and cooldowns
        // Ground slam if player is close
        if (distance <= this.attacks.slam.range && this.attacks.slam.cooldown <= 0) {
            this.groundSlam();
            return;
        }

        // Spawn minions periodically
        if (this.attacks.minions.cooldown <= 0) {
            this.spawnMinions();
            return;
        }

        // Laser attack if off cooldown
        if (this.attacks.laser.cooldown <= 0) {
            this.startLaserAttack();
            return;
        }

        // Move toward player slowly
        if (distance > this.attacks.slam.range) {
            const moveAmount = this.speed * deltaTime;
            myPos.x += direction.x * moveAmount;
            myPos.z += direction.z * moveAmount;
        }
    }

    /**
     * Override die to clean up drone and notify boss-specific listeners.
     */
    die() {
        console.log('BOSS DEFEATED!');

        // Clean up laser
        if (this.laserLine) {
            this.laserLine.dispose();
            this.laserLine = null;
        }

        // Deactivate drone camera target
        if (this.droneCameraTarget) {
            this.droneCameraTarget.deactivate();
        }

        // Dispose drone
        if (this.drone) {
            this.drone.dispose();
            this.drone = null;
        }

        // Large death explosion
        this.createDeathExplosion();

        super.die();
    }

    /**
     * Create epic death explosion.
     */
    createDeathExplosion() {
        const pos = this.mesh.position.clone();

        // Multiple expanding spheres
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const explosion = MeshBuilder.CreateSphere(
                    `bossExplosion_${i}`,
                    { diameter: 4 },
                    this.scene
                );
                explosion.position = pos.clone();
                explosion.position.y = 2 + i;

                const expMat = new StandardMaterial(`expMat_${i}`, this.scene);
                expMat.diffuseColor = new Color3(1, 0.3, 0.5);
                expMat.emissiveColor = new Color3(1, 0, 0.5);
                expMat.alpha = 0.9;
                explosion.material = expMat;

                let scale = 1;
                const animate = () => {
                    scale += 0.4;
                    explosion.scaling = new Vector3(scale, scale, scale);
                    expMat.alpha -= 0.1;
                    if (expMat.alpha <= 0) {
                        explosion.dispose();
                    } else {
                        setTimeout(animate, 50);
                    }
                };
                setTimeout(animate, 50);
            }, i * 200);
        }
    }
}
