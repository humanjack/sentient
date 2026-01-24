/**
 * EffectsManager.js - Manages visual effects throughout the game.
 * Singleton for easy access from anywhere.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { PointLight } from '@babylonjs/core/Lights/pointLight';

export class EffectsManager {
    // Singleton instance
    static instance = null;

    static getInstance() {
        return EffectsManager.instance;
    }

    /**
     * Create effects manager.
     * @param {Scene} scene - Babylon.js scene
     */
    constructor(scene) {
        // Singleton
        EffectsManager.instance = this;

        this.scene = scene;

        // Active effects for cleanup
        this.activeEffects = [];

        // Camera reference for screen shake
        this.camera = null;
        this.originalCameraPosition = null;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;

        console.log('EffectsManager initialized');
    }

    /**
     * Set camera reference for screen shake.
     * @param {Camera} camera
     */
    setCamera(camera) {
        this.camera = camera;
    }

    /**
     * Create muzzle flash effect at weapon position.
     * @param {Vector3} position
     */
    createMuzzleFlash(position) {
        // Light flash
        const light = new PointLight('muzzleFlash', position, this.scene);
        light.diffuse = new Color3(1, 0.8, 0.3);
        light.intensity = 3;
        light.range = 5;

        // Small sphere flash
        const flash = MeshBuilder.CreateSphere('flash', { diameter: 0.3 }, this.scene);
        flash.position = position.clone();

        const flashMat = new StandardMaterial('flashMat', this.scene);
        flashMat.emissiveColor = new Color3(1, 0.8, 0.3);
        flashMat.disableLighting = true;
        flash.material = flashMat;

        // Clean up after brief moment
        setTimeout(() => {
            light.dispose();
            flash.dispose();
        }, 50);
    }

    /**
     * Create hit spark effect at impact point.
     * @param {Vector3} position
     * @param {Color3} color - Optional color override
     */
    createHitSpark(position, color = new Color3(1, 0.6, 0)) {
        // Multiple small sparks flying outward
        const sparkCount = 5;

        for (let i = 0; i < sparkCount; i++) {
            const spark = MeshBuilder.CreateSphere('spark', { diameter: 0.1 }, this.scene);
            spark.position = position.clone();

            const sparkMat = new StandardMaterial('sparkMat', this.scene);
            sparkMat.emissiveColor = color;
            sparkMat.disableLighting = true;
            spark.material = sparkMat;

            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI - Math.PI / 2;
            const speed = 3 + Math.random() * 3;

            const velocity = new Vector3(
                Math.cos(angle) * Math.cos(elevation) * speed,
                Math.sin(elevation) * speed + 2,
                Math.sin(angle) * Math.cos(elevation) * speed
            );

            // Animate
            let life = 0;
            const maxLife = 300;

            const animate = () => {
                life += 16;
                const progress = life / maxLife;

                // Move
                spark.position.x += velocity.x * 0.016;
                spark.position.y += velocity.y * 0.016;
                spark.position.z += velocity.z * 0.016;

                // Gravity
                velocity.y -= 0.3;

                // Fade and shrink
                sparkMat.alpha = 1 - progress;
                spark.scaling.setAll(1 - progress);

                if (life >= maxLife) {
                    spark.dispose();
                } else {
                    setTimeout(animate, 16);
                }
            };
            setTimeout(animate, 16);
        }
    }

    /**
     * Create enemy hit flash effect.
     * @param {Mesh} enemyMesh
     */
    createEnemyHitFlash(enemyMesh) {
        if (!enemyMesh || !enemyMesh.material) return;

        const originalEmissive = enemyMesh.material.emissiveColor.clone();

        // Flash white/red
        enemyMesh.material.emissiveColor = new Color3(1, 0.5, 0.5);

        setTimeout(() => {
            if (enemyMesh && enemyMesh.material) {
                enemyMesh.material.emissiveColor = originalEmissive;
            }
        }, 100);
    }

    /**
     * Create explosion effect.
     * @param {Vector3} position
     * @param {number} size - Explosion size multiplier
     * @param {Color3} color - Explosion color
     */
    createExplosion(position, size = 1, color = new Color3(1, 0.5, 0)) {
        // Expanding sphere
        const explosion = MeshBuilder.CreateSphere('explosion', { diameter: 2 * size }, this.scene);
        explosion.position = position.clone();

        const expMat = new StandardMaterial('expMat', this.scene);
        expMat.emissiveColor = color;
        expMat.disableLighting = true;
        expMat.alpha = 0.8;
        explosion.material = expMat;

        // Light
        const light = new PointLight('expLight', position, this.scene);
        light.diffuse = color;
        light.intensity = 5 * size;
        light.range = 10 * size;

        // Animate
        let scale = 1;
        const maxScale = 3 * size;

        const animate = () => {
            scale += 0.2 * size;
            explosion.scaling.setAll(scale);
            expMat.alpha -= 0.1;
            light.intensity -= 0.5 * size;

            if (scale >= maxScale || expMat.alpha <= 0) {
                explosion.dispose();
                light.dispose();
            } else {
                setTimeout(animate, 30);
            }
        };
        setTimeout(animate, 30);

        // Screen shake for large explosions
        if (size >= 1.5) {
            this.shakeScreen(0.3 * size, 200);
        }
    }

    /**
     * Create death explosion for enemy.
     * @param {Vector3} position
     */
    createDeathExplosion(position) {
        this.createExplosion(position, 0.8, new Color3(1, 0.3, 0));
        this.createHitSpark(position, new Color3(1, 0.5, 0));
    }

    /**
     * Create dash trail effect.
     * @param {Vector3} startPosition
     * @param {Vector3} endPosition
     */
    createDashTrail(startPosition, endPosition) {
        // Create ghost meshes along the trail
        const trailCount = 5;
        const direction = endPosition.subtract(startPosition);
        const length = direction.length();
        direction.normalize();

        for (let i = 0; i < trailCount; i++) {
            const progress = i / trailCount;
            const pos = startPosition.add(direction.scale(length * progress));

            const ghost = MeshBuilder.CreateCylinder('ghost', { height: 2, diameter: 1 }, this.scene);
            ghost.position = pos;
            ghost.position.y = 1;

            const ghostMat = new StandardMaterial('ghostMat', this.scene);
            ghostMat.diffuseColor = new Color3(0.2, 0.6, 1.0);
            ghostMat.emissiveColor = new Color3(0.1, 0.3, 0.5);
            ghostMat.alpha = 0.5 * (1 - progress);
            ghost.material = ghostMat;

            // Fade out
            let alpha = ghostMat.alpha;
            const fadeSpeed = 0.1;

            const fade = () => {
                alpha -= fadeSpeed;
                ghostMat.alpha = alpha;

                if (alpha <= 0) {
                    ghost.dispose();
                } else {
                    setTimeout(fade, 30);
                }
            };
            setTimeout(fade, 50 + i * 50);
        }
    }

    /**
     * Create flash bang effect.
     * @param {Vector3} position
     */
    createFlashBangEffect(position) {
        // Bright white flash
        const flash = MeshBuilder.CreateSphere('flashBang', { diameter: 16 }, this.scene);
        flash.position = position;

        const flashMat = new StandardMaterial('flashMat', this.scene);
        flashMat.emissiveColor = new Color3(1, 1, 1);
        flashMat.disableLighting = true;
        flashMat.alpha = 0.9;
        flash.material = flashMat;

        // Bright light
        const light = new PointLight('flashLight', position, this.scene);
        light.diffuse = new Color3(1, 1, 0.8);
        light.intensity = 10;
        light.range = 20;

        // Fade out
        let alpha = 0.9;
        const fadeSpeed = 0.15;

        const fade = () => {
            alpha -= fadeSpeed;
            flashMat.alpha = alpha;
            light.intensity -= 1.5;

            if (alpha <= 0) {
                flash.dispose();
                light.dispose();
            } else {
                setTimeout(fade, 30);
            }
        };
        setTimeout(fade, 30);

        // Screen shake
        this.shakeScreen(0.2, 150);
    }

    /**
     * Create fire wall effect.
     * @param {Vector3} position
     * @param {number} duration - Duration in seconds
     */
    createFireWallEffect(position, duration = 5) {
        // Fire particles system
        const particleSystem = new ParticleSystem('fireParticles', 500, this.scene);

        // Use simple colored particle instead of texture
        particleSystem.particleTexture = null;

        // Position
        particleSystem.emitter = position;
        particleSystem.minEmitBox = new Vector3(-4, 0, -0.25);
        particleSystem.maxEmitBox = new Vector3(4, 0, 0.25);

        // Particle properties
        particleSystem.color1 = new Color4(1, 0.5, 0, 1);
        particleSystem.color2 = new Color4(1, 0.2, 0, 1);
        particleSystem.colorDead = new Color4(0.2, 0, 0, 0);

        particleSystem.minSize = 0.3;
        particleSystem.maxSize = 0.8;

        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.6;

        particleSystem.emitRate = 200;

        particleSystem.direction1 = new Vector3(-0.5, 3, -0.5);
        particleSystem.direction2 = new Vector3(0.5, 5, 0.5);

        particleSystem.gravity = new Vector3(0, -2, 0);

        particleSystem.start();

        // Stop after duration
        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => particleSystem.dispose(), 1000);
        }, duration * 1000);
    }

    /**
     * Create ultimate explosion effect.
     * @param {Vector3} position
     */
    createUltimateExplosion(position) {
        // Multiple expanding rings
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ring = MeshBuilder.CreateTorus('ultimateRing', {
                    diameter: 4,
                    thickness: 1,
                    tessellation: 32
                }, this.scene);
                ring.position = position.clone();
                ring.position.y = 0.5 + i * 0.5;
                ring.rotation.x = Math.PI / 2;

                const ringMat = new StandardMaterial('ringMat', this.scene);
                ringMat.emissiveColor = new Color3(1, 0.3, 0);
                ringMat.disableLighting = true;
                ringMat.alpha = 0.9;
                ring.material = ringMat;

                // Expand and fade
                let scale = 1;
                const maxScale = 10;

                const animate = () => {
                    scale += 0.5;
                    ring.scaling.setAll(scale);
                    ringMat.alpha = 0.9 * (1 - scale / maxScale);

                    if (scale >= maxScale) {
                        ring.dispose();
                    } else {
                        setTimeout(animate, 30);
                    }
                };
                setTimeout(animate, 30);
            }, i * 100);
        }

        // Central explosion
        this.createExplosion(position, 3, new Color3(1, 0.3, 0));

        // Major screen shake
        this.shakeScreen(0.5, 400);
    }

    /**
     * Shake the screen.
     * @param {number} intensity - Shake intensity
     * @param {number} duration - Duration in ms
     */
    shakeScreen(intensity, duration) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }

    /**
     * Update screen shake (call every frame).
     * @param {number} deltaTime
     */
    updateScreenShake(deltaTime) {
        if (!this.camera || this.shakeDuration <= 0) return;

        // Store original position if not set
        if (!this.originalCameraPosition) {
            this.originalCameraPosition = this.camera.position.clone();
        }

        // Apply random offset
        const offset = new Vector3(
            (Math.random() - 0.5) * 2 * this.shakeIntensity,
            (Math.random() - 0.5) * 2 * this.shakeIntensity,
            (Math.random() - 0.5) * 2 * this.shakeIntensity
        );

        // Note: This is a simplified shake - actual implementation may vary
        // based on how the camera system works

        this.shakeDuration -= deltaTime * 1000;

        if (this.shakeDuration <= 0) {
            this.shakeIntensity = 0;
            this.originalCameraPosition = null;
        }
    }

    /**
     * Create damage vignette effect.
     */
    createDamageVignette() {
        // This is handled by the HUD damage flash
        // Could be enhanced with actual vignette overlay
    }

    /**
     * Create ambient dust particles.
     */
    createAmbientDust() {
        const particleSystem = new ParticleSystem('dustParticles', 100, this.scene);

        particleSystem.particleTexture = null;

        particleSystem.emitter = Vector3.Zero();
        particleSystem.minEmitBox = new Vector3(-25, 0, -25);
        particleSystem.maxEmitBox = new Vector3(25, 5, 25);

        particleSystem.color1 = new Color4(0.5, 0.5, 0.5, 0.1);
        particleSystem.color2 = new Color4(0.4, 0.4, 0.4, 0.05);
        particleSystem.colorDead = new Color4(0.3, 0.3, 0.3, 0);

        particleSystem.minSize = 0.02;
        particleSystem.maxSize = 0.05;

        particleSystem.minLifeTime = 5;
        particleSystem.maxLifeTime = 10;

        particleSystem.emitRate = 10;

        particleSystem.direction1 = new Vector3(-0.1, 0.1, -0.1);
        particleSystem.direction2 = new Vector3(0.1, 0.2, 0.1);

        particleSystem.start();

        return particleSystem;
    }

    /**
     * Clean up all active effects.
     */
    dispose() {
        for (const effect of this.activeEffects) {
            if (effect.dispose) {
                effect.dispose();
            }
        }
        this.activeEffects = [];
    }
}
