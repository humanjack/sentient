/**
 * AbilityFlashBang.js - Stun grenade that blinds and stuns enemies.
 * Key: Q, Cooldown: 15 seconds
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Ability } from './Ability.js';

export class AbilityFlashBang extends Ability {
    constructor() {
        super({
            name: 'Flashbang',
            cooldown: 15,
            key: 'Q',
        });

        this.projectileSpeed = 15;
        this.fuseTime = 1000; // ms before explosion
        this.stunRadius = 8;
        this.stunDuration = 3; // seconds
    }

    /**
     * Execute flashbang ability.
     * @param {Object} context
     * @returns {boolean}
     */
    execute(context) {
        if (!this.canUse()) {
            return false;
        }

        const { playerPosition, playerDirection, scene, getEnemies } = context;

        // Calculate throw direction
        let throwDir = playerDirection.clone();
        if (throwDir.length() < 0.1) {
            throwDir = new Vector3(0, 0, 1);
        }
        throwDir.y = 0;
        throwDir.normalize();

        // Create projectile
        const startPos = playerPosition.clone();
        startPos.y = 1;

        this.createProjectile(startPos, throwDir, scene, getEnemies);

        console.log('FLASHBANG OUT!');

        this.startCooldown();
        return true;
    }

    /**
     * Create and animate the flashbang projectile.
     * @param {Vector3} startPos
     * @param {Vector3} direction
     * @param {Scene} scene
     * @param {function} getEnemies
     */
    createProjectile(startPos, direction, scene, getEnemies) {
        // Create projectile mesh
        const projectile = MeshBuilder.CreateSphere('flashbang', { diameter: 0.3 }, scene);
        projectile.position = startPos.clone();

        const mat = new StandardMaterial('flashbangMat', scene);
        mat.emissiveColor = new Color3(1, 1, 0.5);
        mat.disableLighting = true;
        projectile.material = mat;

        // Animate projectile
        const velocity = direction.scale(this.projectileSpeed);
        let elapsed = 0;

        const moveInterval = setInterval(() => {
            elapsed += 16;

            // Move projectile
            projectile.position.addInPlace(velocity.scale(0.016));

            // Add slight arc (gravity)
            projectile.position.y -= 0.02;

            // Check if hit ground or time expired
            if (projectile.position.y <= 0.2 || elapsed >= this.fuseTime) {
                clearInterval(moveInterval);
                this.explode(projectile.position, scene, getEnemies);
                projectile.dispose();
            }
        }, 16);
    }

    /**
     * Flashbang explosion - stun all enemies in radius.
     * @param {Vector3} position
     * @param {Scene} scene
     * @param {function} getEnemies
     */
    explode(position, scene, getEnemies) {
        // Create flash effect
        this.createFlashEffect(position, scene);

        // Stun enemies in radius
        if (getEnemies) {
            const enemies = getEnemies();
            enemies.forEach(enemy => {
                const dist = Vector3.Distance(position, enemy.getPosition());
                if (dist <= this.stunRadius) {
                    enemy.stun(this.stunDuration);
                    console.log(`Stunned enemy at distance ${dist.toFixed(1)}`);
                }
            });
        }
    }

    /**
     * Create bright flash visual effect.
     * @param {Vector3} position
     * @param {Scene} scene
     */
    createFlashEffect(position, scene) {
        // Create expanding flash sphere
        const flash = MeshBuilder.CreateSphere('flash', { diameter: 1 }, scene);
        flash.position = position.clone();
        flash.position.y = 1;

        const mat = new StandardMaterial('flashMat', scene);
        mat.emissiveColor = new Color3(1, 1, 1);
        mat.alpha = 1;
        mat.disableLighting = true;
        flash.material = mat;

        // Expand and fade
        let elapsed = 0;
        const duration = 300;

        const animInterval = setInterval(() => {
            elapsed += 16;
            const progress = elapsed / duration;

            // Expand
            const scale = 1 + progress * this.stunRadius;
            flash.scaling.setAll(scale);

            // Fade
            mat.alpha = 1 - progress;

            if (elapsed >= duration) {
                clearInterval(animInterval);
                if (mat) mat.dispose();
                flash.dispose();
            }
        }, 16);
    }
}
