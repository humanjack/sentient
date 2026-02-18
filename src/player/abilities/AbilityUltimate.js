/**
 * AbilityUltimate.js - Massive fire explosion ultimate ability.
 * Key: X, No cooldown - uses charge instead
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Ability } from './Ability.js';

export class AbilityUltimate extends Ability {
    constructor() {
        super({
            name: 'Inferno',
            cooldown: 0, // No cooldown, uses charge
            key: 'X',
        });

        this.explosionRadius = 10;
        this.damage = 100;

        // Override isReady - controlled by charge
        this.isReady = false;
    }

    /**
     * Check if ultimate can be used.
     * @param {number} charge - Current ultimate charge (0-100)
     * @returns {boolean}
     */
    canUseWithCharge(charge) {
        return charge >= 100;
    }

    /**
     * Execute ultimate ability.
     * @param {Object} context
     * @returns {boolean}
     */
    execute(context) {
        const { playerPosition, scene, getEnemies, onUltimateUsed } = context;

        // Create massive explosion
        this.createExplosion(playerPosition, scene, getEnemies);

        // Notify that ultimate was used (to reset charge)
        if (onUltimateUsed) {
            onUltimateUsed();
        }

        console.log('ULTIMATE: INFERNO!');

        return true;
    }

    /**
     * Create the ultimate explosion effect.
     * @param {Vector3} center
     * @param {Scene} scene
     * @param {function} getEnemies
     */
    createExplosion(center, scene, getEnemies) {
        const explosionCenter = center.clone();
        explosionCenter.y = 1;

        // Create expanding fire ring
        this.createFireRing(explosionCenter, scene);

        // Create central explosion sphere
        this.createExplosionSphere(explosionCenter, scene);

        // Screen shake effect
        this.createScreenShake(scene);

        // Damage all enemies in radius
        setTimeout(() => {
            if (getEnemies) {
                const enemies = getEnemies();
                let hitCount = 0;

                enemies.forEach(enemy => {
                    const dist = Vector3.Distance(explosionCenter, enemy.getPosition());
                    if (dist <= this.explosionRadius) {
                        enemy.takeDamage(this.damage);
                        hitCount++;
                    }
                });

                console.log(`Ultimate hit ${hitCount} enemies for ${this.damage} damage each`);
            }
        }, 200); // Slight delay for visual effect
    }

    /**
     * Create expanding fire ring.
     * @param {Vector3} center
     * @param {Scene} scene
     */
    createFireRing(center, scene) {
        const ring = MeshBuilder.CreateTorus('explosionRing', {
            diameter: 1,
            thickness: 0.5,
            tessellation: 32,
        }, scene);
        ring.position = center.clone();
        ring.position.y = 0.5;
        ring.rotation.x = Math.PI / 2;

        const mat = new StandardMaterial('ringMat', scene);
        mat.emissiveColor = new Color3(1, 0.5, 0);
        mat.disableLighting = true;
        mat.alpha = 1;
        ring.material = mat;

        // Expand and fade
        let elapsed = 0;
        const duration = 600;

        const animInterval = setInterval(() => {
            elapsed += 16;
            const progress = elapsed / duration;

            // Expand ring
            const scale = 1 + progress * this.explosionRadius * 2;
            ring.scaling.x = scale;
            ring.scaling.z = scale;

            // Fade out
            mat.alpha = 1 - progress;
            mat.emissiveColor = new Color3(1, 0.5 - progress * 0.3, 0);

            if (elapsed >= duration) {
                clearInterval(animInterval);
                if (mat) mat.dispose();
                ring.dispose();
            }
        }, 16);
    }

    /**
     * Create central explosion sphere.
     * @param {Vector3} center
     * @param {Scene} scene
     */
    createExplosionSphere(center, scene) {
        const sphere = MeshBuilder.CreateSphere('explosionSphere', { diameter: 2 }, scene);
        sphere.position = center.clone();

        const mat = new StandardMaterial('sphereMat', scene);
        mat.emissiveColor = new Color3(1, 0.8, 0.3);
        mat.disableLighting = true;
        mat.alpha = 1;
        sphere.material = mat;

        // Expand rapidly then fade
        let elapsed = 0;
        const duration = 400;

        const animInterval = setInterval(() => {
            elapsed += 16;
            const progress = elapsed / duration;

            // Quick expansion
            const scale = 2 + progress * 5;
            sphere.scaling.setAll(scale);

            // Color shift and fade
            mat.emissiveColor = new Color3(1, 0.8 - progress * 0.5, 0.3 - progress * 0.3);
            mat.alpha = 1 - progress;

            if (elapsed >= duration) {
                clearInterval(animInterval);
                if (mat) mat.dispose();
                sphere.dispose();
            }
        }, 16);

        // Create fire particles
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createFireParticle(center, scene);
            }, i * 30);
        }
    }

    /**
     * Create a fire particle shooting outward.
     * @param {Vector3} center
     * @param {Scene} scene
     */
    createFireParticle(center, scene) {
        const particle = MeshBuilder.CreateSphere('ultParticle', { diameter: 0.4 }, scene);
        particle.position = center.clone();
        particle.position.y = 1 + Math.random();

        const mat = new StandardMaterial('ultParticleMat', scene);
        mat.emissiveColor = new Color3(1, 0.5 + Math.random() * 0.3, 0);
        mat.disableLighting = true;
        mat.alpha = 1;
        particle.material = mat;

        // Random outward velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = 5 + Math.random() * 10;
        const velocity = new Vector3(
            Math.cos(angle) * speed,
            2 + Math.random() * 3,
            Math.sin(angle) * speed
        );

        let elapsed = 0;
        const lifetime = 800;

        const animInterval = setInterval(() => {
            elapsed += 16;
            const progress = elapsed / lifetime;

            // Move particle
            particle.position.addInPlace(velocity.scale(0.016));
            velocity.y -= 0.15; // Gravity

            // Fade and shrink
            mat.alpha = 1 - progress;
            particle.scaling.setAll(1 - progress * 0.5);

            if (elapsed >= lifetime || particle.position.y < 0) {
                clearInterval(animInterval);
                if (mat) mat.dispose();
                particle.dispose();
            }
        }, 16);
    }

    /**
     * Create screen shake effect.
     * @param {Scene} scene
     */
    createScreenShake(scene) {
        const camera = scene.activeCamera;
        if (!camera) return;

        const originalPos = camera.position.clone();
        let elapsed = 0;
        const duration = 400;
        const intensity = 0.5;

        const shakeInterval = setInterval(() => {
            elapsed += 16;

            // Random shake offset
            const shake = new Vector3(
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity
            );

            // Decrease intensity over time
            const factor = 1 - (elapsed / duration);
            camera.position = originalPos.add(shake.scale(factor));

            if (elapsed >= duration) {
                clearInterval(shakeInterval);
                // Don't reset position - let camera system handle it
            }
        }, 16);
    }
}
