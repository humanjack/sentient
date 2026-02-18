/**
 * EnemySoldier.js - Ranged enemy that stops at distance and shoots.
 * From GAME_SPEC: Health 100, Speed 3, Rifle attack (10 damage), "stable tactical" camera view.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Ray } from '@babylonjs/core/Culling/ray';
import { EnemyBase } from './EnemyBase.js';
import { GameManager } from '../gameflow/GameManager.js';
import { AssetLoader } from '../core/AssetLoader.js';

export class EnemySoldier extends EnemyBase {
    /**
     * Create a Soldier enemy.
     * @param {Scene} scene - Babylon.js scene
     * @param {Vector3} position - Starting position
     * @param {Object} options - Configuration options
     */
    constructor(scene, position, options = {}) {
        // Soldier stats from GAME_SPEC
        super(scene, position, {
            maxHealth: 100,
            speed: 3,
            damage: 10,
            enemyType: 'soldier',
            name: options.name || 'Soldier',
            onDeath: options.onDeath,
            getPlayerPosition: options.getPlayerPosition,
        });

        // Attack configuration
        this.attackRange = 10; // Stops at this range to shoot
        this.preferredRange = 8; // Tries to maintain this range
        this.attackCooldown = 0;
        this.attackCooldownTime = 1.5; // seconds between shots

        // Create the soldier mesh
        this.createMesh();
    }

    /**
     * Create the soldier's visual representation.
     * Blue box placeholder.
     */
    createMesh() {
        const assetLoader = AssetLoader.getInstance();
        const model = assetLoader.has('enemy_soldier') ? assetLoader.cloneMesh('enemy_soldier', `soldier_${Date.now()}`) : null;

        if (model) {
            model.position = this.position.clone();
            model.position.y = 0;
            this.setMesh(model);
            return;
        }

        // Geometric fallback - blue box
        const body = MeshBuilder.CreateBox(
            `soldier_${Date.now()}`,
            { width: 1, height: 2, depth: 1 },
            this.scene
        );
        body.position = this.position.clone();
        body.position.y = 1;

        const mat = new StandardMaterial('soldierMat', this.scene);
        mat.diffuseColor = new Color3(0.2, 0.3, 0.8);
        mat.emissiveColor = new Color3(0.05, 0.08, 0.2);
        body.material = mat;

        const eye = MeshBuilder.CreateSphere('soldierEye', { diameter: 0.3 }, this.scene);
        eye.parent = body;
        eye.position = new Vector3(0, 0.5, 0.5);
        const eyeMat = new StandardMaterial('eyeMat', this.scene);
        eyeMat.diffuseColor = new Color3(0, 1, 1);
        eyeMat.emissiveColor = new Color3(0, 0.3, 0.3);
        eye.material = eyeMat;

        this.setMesh(body);
    }

    /**
     * Check if has clear line of sight to player.
     * @returns {boolean}
     */
    hasLineOfSight() {
        const playerPos = this.getPlayerPosition();
        const myPos = this.mesh.position.clone();
        myPos.y += 1; // Eye level

        const direction = playerPos.subtract(myPos);
        const distance = direction.length();
        direction.normalize();

        // Cast ray toward player
        const ray = new Ray(myPos, direction, distance);
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            // Ignore self and other enemies
            return mesh !== this.mesh && !mesh.name.includes('soldier') &&
                   !mesh.name.includes('grunt') && !mesh.name.includes('sniper') &&
                   !mesh.name.includes('heavy') && !mesh.name.includes('boss');
        });

        // If hit something before reaching player distance, no line of sight
        if (hit && hit.pickedMesh && hit.distance < distance - 1) {
            return false;
        }

        return true;
    }

    /**
     * Shoot at the player.
     */
    shootPlayer() {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.playerHealth) {
            return;
        }

        // Check line of sight
        if (!this.hasLineOfSight()) {
            console.log(`${this.cameraTarget.name} shot blocked!`);
            return;
        }

        // Deal damage to player
        gameManager.playerHealth.takeDamage(this.damage);
        console.log(`${this.cameraTarget.name} shot player for ${this.damage} damage!`);

        // Visual feedback - muzzle flash effect
        this.showMuzzleFlash();

        // Start cooldown
        this.attackCooldown = this.attackCooldownTime;
    }

    /**
     * Show muzzle flash effect.
     */
    showMuzzleFlash() {
        // Create brief flash sphere at gun position
        const flash = MeshBuilder.CreateSphere(
            'muzzleFlash',
            { diameter: 0.3 },
            this.scene
        );
        flash.position = this.mesh.position.clone();
        flash.position.y += 1;
        flash.position.z += 0.6;

        const flashMat = new StandardMaterial('flashMat', this.scene);
        flashMat.diffuseColor = new Color3(1, 1, 0);
        flashMat.emissiveColor = new Color3(1, 0.8, 0);
        flash.material = flashMat;

        // Remove after brief moment
        setTimeout(() => {
            if (flashMat) flashMat.dispose();
            flash.dispose();
        }, 100);
    }

    /**
     * Update soldier AI - approach then shoot.
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Call base update (handles stun countdown)
        super.update(deltaTime);

        if (!this.isAlive || !this.mesh) return;

        // Skip AI if stunned
        if (this.isStunned) {
            // Visual feedback for stun
            if (this.mesh.material) {
                this.mesh.material.emissiveColor = new Color3(0.5, 0.5, 0.1);
            }
            return;
        } else if (this.mesh.material) {
            // Reset to normal color
            this.mesh.material.emissiveColor = new Color3(0.05, 0.08, 0.2);
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

        // If within attack range, stop and shoot
        if (distance <= this.attackRange) {
            if (this.attackCooldown <= 0) {
                this.shootPlayer();
            }
            return;
        }

        // Move toward player until in range
        const moveAmount = this.speed * deltaTime;
        myPos.x += direction.x * moveAmount;
        myPos.z += direction.z * moveAmount;
    }

    /**
     * Override die to add soldier-specific effects.
     */
    die() {
        // Flash blue before dying
        if (this.mesh && this.mesh.material) {
            this.mesh.material.emissiveColor = new Color3(0, 0.5, 1);
        }

        super.die();
    }
}
