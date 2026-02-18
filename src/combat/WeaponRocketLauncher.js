/**
 * WeaponRocketLauncher.js - Rocket Launcher with AOE damage.
 * From GAME_SPEC: 3 ammo, 150 damage (AOE), slow fire rate, $2000
 */
import { Ray } from '@babylonjs/core/Culling/ray';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Weapon } from './Weapon.js';

export class WeaponRocketLauncher extends Weapon {
    constructor(options = {}) {
        super({
            name: 'Rocket',
            damage: 150,
            fireRate: 1500, // Slow fire rate
            maxAmmo: 3,
            reloadTime: 3000,
            ...options,
        });

        this.range = 100;
        this.blastRadius = 8; // AOE radius
        this.projectileSpeed = 40; // Units per second
        this.activeProjectiles = [];
    }

    /**
     * Fire a rocket projectile.
     * @param {Vector3} origin - Player position
     * @param {Vector3} direction - Aim direction
     * @param {Scene} scene - Babylon.js scene
     * @param {function} onHit - Callback when rocket explodes near enemies
     * @returns {Object|null}
     */
    fire(origin, direction, scene, onHit) {
        if (!this.canFire()) {
            if (this.currentAmmo <= 0 && this.onEmpty) {
                this.onEmpty();
            }
            return null;
        }

        this.currentAmmo--;
        this.lastFireTime = performance.now();

        if (this.onFire) {
            this.onFire(this);
        }

        // Create rocket projectile mesh
        const rocket = MeshBuilder.CreateSphere('rocket', { diameter: 0.4 }, scene);
        rocket.position = origin.clone();
        rocket.position.y = 1;

        const mat = new StandardMaterial('rocketMat', scene);
        mat.diffuseColor = new Color3(1, 0.3, 0);
        mat.emissiveColor = new Color3(1, 0.5, 0);
        rocket.material = mat;

        // Store projectile data
        const projectile = {
            mesh: rocket,
            direction: direction.normalize(),
            speed: this.projectileSpeed,
            distanceTraveled: 0,
            maxDistance: this.range,
            scene,
            onHit,
            damage: this.damage,
            blastRadius: this.blastRadius,
        };

        this.activeProjectiles.push(projectile);

        // Also do a raycast for instant-hit fallback at close range
        const ray = new Ray(origin, direction, 3);
        const hit = scene.pickWithRay(ray, (mesh) => {
            const name = mesh.name.toLowerCase();
            if (name === 'ground') return false;
            if (name.includes('wall')) return true; // Rockets hit walls
            if (name.includes('player')) return false;
            if (name.includes('indicator')) return false;
            if (name.includes('spawn')) return false;
            if (name.includes('rocket')) return false;
            return true;
        });

        if (hit && hit.hit && hit.distance < 3) {
            this.explodeRocket(projectile, hit.pickedPoint);
        }

        return { hit: false, projectile: true };
    }

    /**
     * Explode rocket at a position, dealing AOE damage.
     * @param {Object} projectile - Projectile data
     * @param {Vector3} position - Explosion center
     */
    explodeRocket(projectile, position) {
        // Remove projectile mesh and material
        if (projectile.mesh) {
            if (projectile.mesh.material) {
                projectile.mesh.material.dispose();
            }
            projectile.mesh.dispose();
        }

        // Remove from active list
        const idx = this.activeProjectiles.indexOf(projectile);
        if (idx !== -1) {
            this.activeProjectiles.splice(idx, 1);
        }

        // Find all meshes in blast radius and call onHit for each
        if (projectile.onHit) {
            // Create a fake hit result for AOE
            const explosionHit = {
                hit: true,
                pickedPoint: position,
                pickedMesh: null,
                distance: 0,
            };
            // Signal AOE hit — DamageSystem will handle finding enemies in radius
            projectile.onHit(explosionHit, projectile.damage, false, {
                isAOE: true,
                blastRadius: projectile.blastRadius,
                center: position,
            });
        }

        console.log(`Rocket exploded at (${position.x.toFixed(1)}, ${position.z.toFixed(1)}) - radius: ${projectile.blastRadius}`);
    }

    /**
     * Update all active projectiles. Call every frame.
     */
    update() {
        super.update();

        const dt = 1 / 60; // Approximate frame time

        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const proj = this.activeProjectiles[i];
            const moveAmount = proj.speed * dt;

            // Move projectile
            proj.mesh.position.addInPlace(proj.direction.scale(moveAmount));
            proj.distanceTraveled += moveAmount;

            // Check for collision via raycast
            const ray = new Ray(proj.mesh.position, proj.direction, moveAmount + 0.5);
            const hit = proj.scene.pickWithRay(ray, (mesh) => {
                const name = mesh.name.toLowerCase();
                if (name === 'ground') return true; // Explode on ground
                if (name.includes('wall')) return true;
                if (name.includes('player')) return false;
                if (name.includes('rocket')) return false;
                if (name.includes('indicator')) return false;
                if (name.includes('spawn')) return false;
                return true; // Hit enemies
            });

            if (hit && hit.hit && hit.distance < moveAmount + 0.5) {
                this.explodeRocket(proj, hit.pickedPoint);
                continue;
            }

            // Max distance reached — explode in air
            if (proj.distanceTraveled >= proj.maxDistance) {
                this.explodeRocket(proj, proj.mesh.position.clone());
            }
        }
    }
}
