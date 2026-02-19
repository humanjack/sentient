/**
 * EnemyHeavy.js - Slow, tanky melee enemy.
 * From GAME_SPEC: Health 200, Speed 2, 25 melee damage, "low angle intimidating" camera view.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { EnemyBase } from './EnemyBase.js';
import { AssetLoader } from '../core/AssetLoader.js';
import { GameManager } from '../gameflow/GameManager.js';
import { CameraTarget } from '../camera/CameraTarget.js';

export class EnemyHeavy extends EnemyBase {
    /**
     * Create a Heavy enemy.
     * @param {Scene} scene - Babylon.js scene
     * @param {Vector3} position - Starting position
     * @param {Object} options - Configuration options
     */
    constructor(scene, position, options = {}) {
        // Heavy stats from GAME_SPEC
        super(scene, position, {
            maxHealth: 200,
            speed: 2,
            damage: 25,
            enemyType: 'heavy',
            name: options.name || 'Heavy',
            onDeath: options.onDeath,
            getPlayerPosition: options.getPlayerPosition,
        });

        // Attack configuration
        this.attackRange = 2.0; // Slightly larger melee range
        this.attackCooldown = 0;
        this.attackCooldownTime = 2.0; // seconds between attacks

        // Override camera offset for low angle intimidating view
        this.cameraTarget.offset = new Vector3(0, 1.2, 0);

        // Create the heavy mesh
        this.createMesh();
    }

    /**
     * Create the heavy's visual representation.
     * Large dark red box placeholder.
     */
    createMesh() {
        const loader = AssetLoader.getInstance();
        if (loader && loader.hasAsset('enemy_heavy')) {
            const model = loader.createInstance('enemy_heavy', `heavy_${Date.now()}`);
            if (model) {
                model.position = this.position.clone();
                this.setMesh(model);
                return;
            }
        }

        // Fallback: procedural large dark red box
        const body = MeshBuilder.CreateBox(
            `heavy_${Date.now()}`,
            { width: 2, height: 3, depth: 2 },
            this.scene
        );
        body.position = this.position.clone();
        body.position.y = 1.5;

        const mat = new StandardMaterial('heavyMat', this.scene);
        mat.diffuseColor = new Color3(0.5, 0.1, 0.1);
        mat.emissiveColor = new Color3(0.15, 0.03, 0.03);
        body.material = mat;

        const eye = MeshBuilder.CreateSphere('heavyEye', { diameter: 0.4 }, this.scene);
        eye.parent = body;
        eye.position = new Vector3(0, 0.3, 0.9);
        const eyeMat = new StandardMaterial('eyeMat', this.scene);
        eyeMat.diffuseColor = new Color3(1, 0.3, 0);
        eyeMat.emissiveColor = new Color3(0.5, 0.1, 0);
        eye.material = eyeMat;

        this.setMesh(body);
    }

    /**
     * Attack the player with heavy melee.
     */
    attackPlayer() {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.playerHealth) {
            return;
        }

        // Deal heavy damage to player
        gameManager.playerHealth.takeDamage(this.damage);
        console.log(`${this.cameraTarget.name} SMASHED player for ${this.damage} damage!`);

        // Show attack visual
        this.showAttackEffect();

        // Start cooldown
        this.attackCooldown = this.attackCooldownTime;
    }

    /**
     * Show attack visual effect.
     */
    showAttackEffect() {
        // Create brief impact ring at player position
        const playerPos = this.getPlayerPosition();

        const ring = MeshBuilder.CreateTorus(
            'impactRing',
            { diameter: 3, thickness: 0.3, tessellation: 16 },
            this.scene
        );
        ring.position = playerPos.clone();
        ring.position.y = 0.1;
        ring.rotation.x = Math.PI / 2;

        const ringMat = new StandardMaterial('ringMat', this.scene);
        ringMat.diffuseColor = new Color3(1, 0.3, 0);
        ringMat.emissiveColor = new Color3(0.5, 0.1, 0);
        ringMat.alpha = 0.7;
        ring.material = ringMat;

        // Animate and remove
        let scale = 1;
        const animate = () => {
            scale += 0.15;
            ring.scaling = new Vector3(scale, scale, scale);
            ringMat.alpha -= 0.1;

            if (ringMat.alpha <= 0) {
                ring.dispose();
            } else {
                setTimeout(animate, 50);
            }
        };
        setTimeout(animate, 50);
    }

    /**
     * Update heavy AI - relentless pursuit and smash.
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Call base update (handles stun countdown)
        super.update(deltaTime);

        if (!this.isAlive || !this.mesh) return;

        // Skip AI if stunned
        if (this.isStunned) {
            if (this.mesh.material) {
                this.mesh.material.emissiveColor = new Color3(0.5, 0.5, 0.1);
            }
            return;
        } else if (this.mesh.material) {
            // Reset to normal color
            this.mesh.material.emissiveColor = new Color3(0.15, 0.03, 0.03);
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

        // Attack if close enough
        if (distance <= this.attackRange) {
            if (this.attackCooldown <= 0) {
                this.attackPlayer();
            }
            return;
        }

        // Move toward player - slow but relentless
        const moveAmount = this.speed * deltaTime;
        myPos.x += direction.x * moveAmount;
        myPos.z += direction.z * moveAmount;

        // Ground shake effect when walking (occasional stomp)
        if (Math.random() < 0.02) {
            this.stompEffect();
        }

        this.animateWalk(deltaTime, true);
    }

    /**
     * Create stomp effect while walking.
     */
    stompEffect() {
        const myPos = this.mesh.position;

        // Small dust puff
        const dust = MeshBuilder.CreateSphere(
            'dust',
            { diameter: 0.5 },
            this.scene
        );
        dust.position = new Vector3(myPos.x, 0.25, myPos.z);

        const dustMat = new StandardMaterial('dustMat', this.scene);
        dustMat.diffuseColor = new Color3(0.5, 0.4, 0.3);
        dustMat.emissiveColor = new Color3(0.2, 0.15, 0.1);
        dustMat.alpha = 0.5;
        dust.material = dustMat;

        // Expand and fade
        let scale = 1;
        const animate = () => {
            scale += 0.1;
            dust.scaling = new Vector3(scale, scale * 0.5, scale);
            dustMat.alpha -= 0.1;

            if (dustMat.alpha <= 0) {
                dust.dispose();
            } else {
                setTimeout(animate, 50);
            }
        };
        setTimeout(animate, 50);
    }

    /**
     * Override die to add heavy-specific effects.
     */
    die() {
        // Flash bright before dying
        if (this.mesh && this.mesh.material) {
            this.mesh.material.emissiveColor = new Color3(1, 0.3, 0);
        }

        // Create larger death explosion for heavy
        const pos = this.mesh.position.clone();
        const explosion = MeshBuilder.CreateSphere(
            'heavyExplosion',
            { diameter: 3 },
            this.scene
        );
        explosion.position = pos;
        explosion.position.y = 1.5;

        const expMat = new StandardMaterial('expMat', this.scene);
        expMat.diffuseColor = new Color3(1, 0.5, 0);
        expMat.emissiveColor = new Color3(1, 0.3, 0);
        expMat.alpha = 0.8;
        explosion.material = expMat;

        // Expand and fade
        let scale = 1;
        const animate = () => {
            scale += 0.2;
            explosion.scaling = new Vector3(scale, scale, scale);
            expMat.alpha -= 0.15;

            if (expMat.alpha <= 0) {
                explosion.dispose();
            } else {
                setTimeout(animate, 50);
            }
        };
        setTimeout(animate, 50);

        super.die();
    }
}
