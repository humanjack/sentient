/**
 * AbilityFireWall.js - Creates a wall of fire that damages enemies.
 * Key: C, Cooldown: 20 seconds
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Ability } from './Ability.js';

export class AbilityFireWall extends Ability {
    constructor() {
        super({
            name: 'Fire Wall',
            cooldown: 20,
            key: 'C',
        });

        this.wallWidth = 8;
        this.wallHeight = 3;
        this.wallDepth = 0.5;
        this.duration = 5000; // ms
        this.damagePerSecond = 20;
        this.damageInterval = 500; // ms between damage ticks
    }

    /**
     * Execute fire wall ability.
     * @param {Object} context
     * @returns {boolean}
     */
    execute(context) {
        if (!this.canUse()) {
            return false;
        }

        const { playerPosition, playerDirection, scene, getEnemies } = context;

        // Calculate wall position (in front of player)
        let dir = playerDirection.clone();
        if (dir.length() < 0.1) {
            dir = new Vector3(0, 0, 1);
        }
        dir.y = 0;
        dir.normalize();

        const wallPos = playerPosition.add(dir.scale(3));
        wallPos.y = this.wallHeight / 2;

        // Calculate wall rotation (perpendicular to player direction)
        const angle = Math.atan2(dir.x, dir.z);

        this.createFireWall(wallPos, angle, scene, getEnemies);

        console.log('FIRE WALL!');

        this.startCooldown();
        return true;
    }

    /**
     * Create the fire wall mesh and damage zone.
     * @param {Vector3} position
     * @param {number} rotation
     * @param {Scene} scene
     * @param {function} getEnemies
     */
    createFireWall(position, rotation, scene, getEnemies) {
        // Create wall mesh
        const wall = MeshBuilder.CreateBox('fireWall', {
            width: this.wallWidth,
            height: this.wallHeight,
            depth: this.wallDepth,
        }, scene);
        wall.position = position.clone();
        wall.rotation.y = rotation;

        // Fire material
        const mat = new StandardMaterial('fireWallMat', scene);
        mat.emissiveColor = new Color3(1, 0.4, 0);
        mat.diffuseColor = new Color3(1, 0.2, 0);
        mat.alpha = 0.8;
        wall.material = mat;

        // Track damaged enemies to prevent double-hits per tick
        const damagedThisTick = new Set();

        // Damage enemies that pass through
        const damageInterval = setInterval(() => {
            damagedThisTick.clear();

            if (getEnemies) {
                const enemies = getEnemies();
                enemies.forEach(enemy => {
                    if (damagedThisTick.has(enemy)) return;

                    const enemyPos = enemy.getPosition();

                    // Check if enemy is within wall bounds
                    if (this.isInWall(enemyPos, position, rotation)) {
                        const damage = this.damagePerSecond * (this.damageInterval / 1000);
                        enemy.takeDamage(damage);
                        damagedThisTick.add(enemy);
                        console.log(`Fire wall dealt ${damage} damage`);
                    }
                });
            }
        }, this.damageInterval);

        // Animate fire effect
        let elapsed = 0;
        const pulseInterval = setInterval(() => {
            elapsed += 50;

            // Pulse effect
            const pulse = 0.7 + Math.sin(elapsed * 0.01) * 0.3;
            mat.emissiveColor = new Color3(1, 0.3 + pulse * 0.2, 0);
            mat.alpha = 0.6 + pulse * 0.2;

            // Create occasional fire particles
            if (Math.random() < 0.3) {
                this.createFireParticle(position, rotation, scene);
            }
        }, 50);

        // Remove wall after duration
        setTimeout(() => {
            clearInterval(damageInterval);
            clearInterval(pulseInterval);

            // Fade out
            let fadeElapsed = 0;
            const fadeInterval = setInterval(() => {
                fadeElapsed += 16;
                mat.alpha = 0.8 * (1 - fadeElapsed / 300);

                if (fadeElapsed >= 300) {
                    clearInterval(fadeInterval);
                    wall.dispose();
                }
            }, 16);
        }, this.duration);
    }

    /**
     * Check if position is within the fire wall.
     * @param {Vector3} pos - Position to check
     * @param {Vector3} wallPos - Wall center position
     * @param {number} rotation - Wall rotation
     * @returns {boolean}
     */
    isInWall(pos, wallPos, rotation) {
        // Transform position to wall's local space
        const dx = pos.x - wallPos.x;
        const dz = pos.z - wallPos.z;

        // Rotate to align with wall
        const cos = Math.cos(-rotation);
        const sin = Math.sin(-rotation);
        const localX = dx * cos - dz * sin;
        const localZ = dx * sin + dz * cos;

        // Check bounds
        const halfWidth = this.wallWidth / 2 + 0.5; // Add enemy radius
        const halfDepth = this.wallDepth / 2 + 0.5;

        return Math.abs(localX) < halfWidth &&
               Math.abs(localZ) < halfDepth &&
               pos.y < this.wallHeight + 1;
    }

    /**
     * Create a rising fire particle.
     * @param {Vector3} wallPos
     * @param {number} rotation
     * @param {Scene} scene
     */
    createFireParticle(wallPos, rotation, scene) {
        const particle = MeshBuilder.CreateSphere('fireParticle', { diameter: 0.3 }, scene);

        // Random position along wall
        const offset = (Math.random() - 0.5) * this.wallWidth;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        particle.position = new Vector3(
            wallPos.x + offset * cos,
            0.5 + Math.random() * this.wallHeight,
            wallPos.z + offset * sin
        );

        const mat = new StandardMaterial('fireParticleMat', scene);
        mat.emissiveColor = new Color3(1, 0.5, 0);
        mat.disableLighting = true;
        mat.alpha = 0.8;
        particle.material = mat;

        // Rise and fade
        let elapsed = 0;
        const lifetime = 500;

        const animInterval = setInterval(() => {
            elapsed += 16;
            const progress = elapsed / lifetime;

            particle.position.y += 0.05;
            mat.alpha = 0.8 * (1 - progress);
            particle.scaling.setAll(1 - progress * 0.5);

            if (elapsed >= lifetime) {
                clearInterval(animInterval);
                particle.dispose();
            }
        }, 16);
    }
}
