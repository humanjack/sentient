/**
 * EnemyGrunt.js - Fast melee enemy that rushes the player.
 * From GAME_SPEC: Health 50, Speed 4, Melee attack, "shaky aggressive" camera view.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { EnemyBase } from './EnemyBase.js';
import { GameManager } from '../gameflow/GameManager.js';

export class EnemyGrunt extends EnemyBase {
    /**
     * Create a Grunt enemy.
     * @param {Scene} scene - Babylon.js scene
     * @param {Vector3} position - Starting position
     * @param {Object} options - Configuration options
     */
    constructor(scene, position, options = {}) {
        // Grunt stats from GAME_SPEC
        super(scene, position, {
            maxHealth: 50,
            speed: 4,
            damage: 10,
            name: options.name || 'Grunt',
            onDeath: options.onDeath,
            getPlayerPosition: options.getPlayerPosition,
        });

        // Attack range - stops when this close to player
        this.attackRange = 1.5;

        // Attack cooldown (for non-suicide behavior)
        this.attackCooldown = 0;
        this.attackCooldownTime = 1.0; // seconds between attacks

        // Suicide attack mode - grunt dies after attacking
        this.suicideAttack = true;

        // Create the grunt mesh
        this.createMesh();
    }

    /**
     * Create the grunt's visual representation.
     * Red box placeholder (will be replaced with model later).
     */
    createMesh() {
        // Create body (red box, 1x2x1)
        const body = MeshBuilder.CreateBox(
            `grunt_${Date.now()}`,
            { width: 1, height: 2, depth: 1 },
            this.scene
        );

        // Position at spawn point, raised to sit on ground
        body.position = this.position.clone();
        body.position.y = 1; // Half height

        // Red material - aggressive look
        const mat = new StandardMaterial('gruntMat', this.scene);
        mat.diffuseColor = new Color3(0.8, 0.2, 0.2);
        mat.emissiveColor = new Color3(0.2, 0.05, 0.05);
        body.material = mat;

        // Add "eye" indicator showing where camera looks from
        const eye = MeshBuilder.CreateSphere(
            'gruntEye',
            { diameter: 0.3 },
            this.scene
        );
        eye.parent = body;
        eye.position = new Vector3(0, 0.5, 0.5); // Front of face

        const eyeMat = new StandardMaterial('eyeMat', this.scene);
        eyeMat.diffuseColor = new Color3(1, 1, 0);
        eyeMat.emissiveColor = new Color3(0.3, 0.3, 0);
        eye.material = eyeMat;

        this.setMesh(body);
    }

    /**
     * Attack the player.
     */
    attackPlayer() {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.playerHealth) {
            return;
        }

        // Deal damage to player
        gameManager.playerHealth.takeDamage(this.damage);
        console.log(`${this.cameraTarget.name} attacked player for ${this.damage} damage!`);

        // Suicide attack - grunt dies after attacking
        if (this.suicideAttack) {
            this.die();
        } else {
            // Start cooldown
            this.attackCooldown = this.attackCooldownTime;
        }
    }

    /**
     * Update grunt AI - chase the player!
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.isAlive || !this.mesh) return;

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

        // Attack if close enough
        if (distance <= this.attackRange) {
            if (this.attackCooldown <= 0) {
                this.attackPlayer();
            }
            return;
        }

        // Normalize direction
        direction.normalize();

        // Move toward player
        const moveAmount = this.speed * deltaTime;
        myPos.x += direction.x * moveAmount;
        myPos.z += direction.z * moveAmount;

        // Rotate to face player
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;
    }

    /**
     * Override die to add grunt-specific effects.
     */
    die() {
        // Flash red before dying (visual feedback)
        if (this.mesh && this.mesh.material) {
            this.mesh.material.emissiveColor = new Color3(1, 0, 0);
        }

        super.die();
    }
}
