/**
 * EnemySniper.js - Long-range enemy with high damage and laser warning.
 * From GAME_SPEC: Health 75, Speed 2, 25 damage, 3s attack rate, laser warning.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { EnemyBase } from './EnemyBase.js';
import { AssetLoader } from '../core/AssetLoader.js';
import { GameManager } from '../gameflow/GameManager.js';

export class EnemySniper extends EnemyBase {
    /**
     * Create a Sniper enemy.
     * @param {Scene} scene - Babylon.js scene
     * @param {Vector3} position - Starting position
     * @param {Object} options - Configuration options
     */
    constructor(scene, position, options = {}) {
        // Sniper stats from GAME_SPEC
        super(scene, position, {
            maxHealth: 75,
            speed: 2,
            damage: 25,
            enemyType: 'sniper',
            name: options.name || 'Sniper',
            onDeath: options.onDeath,
            getPlayerPosition: options.getPlayerPosition,
        });

        // Attack configuration
        this.minRange = 15; // Minimum preferred distance
        this.maxRange = 25; // Maximum effective range
        this.attackCooldown = 0;
        this.attackCooldownTime = 3.0; // seconds between shots

        // Laser sight state
        this.isCharging = false;
        this.chargeTime = 1.0; // seconds of warning before shot
        this.chargeTimer = 0;
        this.laserLine = null;

        // Create the sniper mesh
        this.createMesh();
    }

    /**
     * Create the sniper's visual representation.
     * Yellow box placeholder.
     */
    createMesh() {
        const loader = AssetLoader.getInstance();
        if (loader && loader.hasAsset('enemy_sniper')) {
            const model = loader.createInstance('enemy_sniper', `sniper_${Date.now()}`);
            if (model) {
                model.position = this.position.clone();
                this.setMesh(model);
                return;
            }
        }

        // Fallback: procedural yellow box
        const body = MeshBuilder.CreateBox(
            `sniper_${Date.now()}`,
            { width: 1, height: 2, depth: 1 },
            this.scene
        );
        body.position = this.position.clone();
        body.position.y = 1;

        const mat = new StandardMaterial('sniperMat', this.scene);
        mat.diffuseColor = new Color3(0.8, 0.7, 0.2);
        mat.emissiveColor = new Color3(0.2, 0.15, 0.05);
        body.material = mat;

        const eye = MeshBuilder.CreateSphere('sniperEye', { diameter: 0.25 }, this.scene);
        eye.parent = body;
        eye.position = new Vector3(0, 0.5, 0.5);
        const eyeMat = new StandardMaterial('eyeMat', this.scene);
        eyeMat.diffuseColor = new Color3(1, 0, 0);
        eyeMat.emissiveColor = new Color3(0.5, 0, 0);
        eye.material = eyeMat;

        this.setMesh(body);
    }

    /**
     * Start charging the shot - shows laser warning.
     */
    startCharging() {
        this.isCharging = true;
        this.chargeTimer = this.chargeTime;
        this.createLaserSight();
        console.log(`${this.cameraTarget.name} aiming...`);
    }

    /**
     * Create the laser sight line.
     */
    createLaserSight() {
        if (this.laserLine) {
            this.laserLine.dispose();
        }

        const playerPos = this.getPlayerPosition();
        const myPos = this.mesh.position.clone();
        myPos.y += 1.5; // Eye level

        const targetPos = playerPos.clone();
        targetPos.y += 1; // Chest level

        // Create line mesh
        this.laserLine = MeshBuilder.CreateLines(
            'laserSight',
            { points: [myPos, targetPos], updatable: true },
            this.scene
        );
        this.laserLine.color = new Color3(1, 0, 0);
    }

    /**
     * Update the laser sight position.
     */
    updateLaserSight() {
        if (!this.laserLine || !this.mesh) return;

        const playerPos = this.getPlayerPosition();
        const myPos = this.mesh.position.clone();
        myPos.y += 1.5;

        const targetPos = playerPos.clone();
        targetPos.y += 1;

        // Recreate with new points
        this.laserLine.dispose();
        this.laserLine = MeshBuilder.CreateLines(
            'laserSight',
            { points: [myPos, targetPos] },
            this.scene
        );
        this.laserLine.color = new Color3(1, 0, 0);
    }

    /**
     * Remove the laser sight.
     */
    removeLaserSight() {
        if (this.laserLine) {
            this.laserLine.dispose();
            this.laserLine = null;
        }
    }

    /**
     * Fire the sniper shot.
     */
    fireShot() {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.playerHealth) {
            return;
        }

        // Deal high damage to player
        gameManager.playerHealth.takeDamage(this.damage);
        console.log(`${this.cameraTarget.name} SNIPED player for ${this.damage} damage!`);

        // Remove laser sight
        this.removeLaserSight();

        // Reset state
        this.isCharging = false;
        this.attackCooldown = this.attackCooldownTime;
    }

    /**
     * Update sniper AI - maintain distance and snipe.
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Call base update (handles stun countdown)
        super.update(deltaTime);

        if (!this.isAlive || !this.mesh) return;

        // Skip AI if stunned
        if (this.isStunned) {
            // Cancel charging if stunned
            if (this.isCharging) {
                this.isCharging = false;
                this.removeLaserSight();
            }
            if (this.mesh.material) {
                this.mesh.material.emissiveColor = new Color3(0.5, 0.5, 0.1);
            }
            return;
        } else if (this.mesh.material) {
            // Reset to normal color (or charging color)
            if (this.isCharging) {
                this.mesh.material.emissiveColor = new Color3(0.5, 0.2, 0.1);
            } else {
                this.mesh.material.emissiveColor = new Color3(0.2, 0.15, 0.05);
            }
        }

        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        const playerPos = this.getPlayerPosition();
        const myPos = this.mesh.position;

        // Calculate direction to player (on XZ plane)
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

        // Handle charging state
        if (this.isCharging) {
            this.chargeTimer -= deltaTime;
            this.updateLaserSight();

            if (this.chargeTimer <= 0) {
                this.fireShot();
            }
            return; // Don't move while charging
        }

        // If player is too close, back away
        if (distance < this.minRange) {
            const moveAmount = this.speed * deltaTime;
            myPos.x -= direction.x * moveAmount;
            myPos.z -= direction.z * moveAmount;
            return;
        }

        // If player is too far, move closer
        if (distance > this.maxRange) {
            const moveAmount = this.speed * deltaTime;
            myPos.x += direction.x * moveAmount;
            myPos.z += direction.z * moveAmount;
            return;
        }

        // In optimal range - start shooting if cooldown ready
        if (this.attackCooldown <= 0) {
            this.startCharging();
        }
    }

    /**
     * Override die to clean up laser sight.
     */
    die() {
        this.removeLaserSight();

        // Flash yellow before dying
        if (this.mesh && this.mesh.material) {
            this.mesh.material.emissiveColor = new Color3(1, 1, 0);
        }

        super.die();
    }
}
