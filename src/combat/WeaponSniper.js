/**
 * WeaponSniper.js - Sniper Rifle weapon.
 * From GAME_SPEC: 5 ammo, 100 damage, very slow fire rate, $1500
 */
import { Ray } from '@babylonjs/core/Culling/ray';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Weapon } from './Weapon.js';

export class WeaponSniper extends Weapon {
    constructor(options = {}) {
        super({
            name: 'Sniper',
            damage: 100,
            fireRate: 1200, // Very slow fire rate
            maxAmmo: 5,
            reloadTime: 2500,
            ...options,
        });

        this.range = 200; // Long range
        this.headshotMultiplier = 2.5; // Massive headshot bonus
    }

    /**
     * Fire the sniper rifle using raycasting.
     * @param {Vector3} origin - Player position (gun muzzle)
     * @param {Vector3} direction - Aim direction (normalized)
     * @param {Scene} scene - Babylon.js scene
     * @param {function} onHit - Callback when enemy is hit
     * @returns {Object|null} Hit result
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

        // Create ray from origin in direction
        const ray = new Ray(origin, direction, this.range);

        // Raycast to find hit
        const hit = scene.pickWithRay(ray, (mesh) => {
            const name = mesh.name.toLowerCase();
            if (name === 'ground') return false;
            if (name.includes('wall')) return false;
            if (name.includes('player')) return false;
            if (name.includes('indicator')) return false;
            if (name.includes('spawn')) return false;
            if (name.includes('seccam')) return false;
            if (name.includes('crate')) return false;
            if (name.includes('pillar')) return false;
            return true;
        });

        if (hit && hit.hit) {
            // Check for headshot (hit point is in upper portion of mesh)
            const meshBounds = hit.pickedMesh.getBoundingInfo();
            const meshTop = meshBounds.boundingBox.maximumWorld.y;
            const meshBottom = meshBounds.boundingBox.minimumWorld.y;
            const meshHeight = meshTop - meshBottom;
            const hitHeight = hit.pickedPoint.y - meshBottom;
            const isHeadshot = hitHeight > meshHeight * 0.75;

            const finalDamage = isHeadshot ? this.damage * this.headshotMultiplier : this.damage;

            console.log(`Sniper ${isHeadshot ? 'HEADSHOT' : 'hit'}: ${hit.pickedMesh.name} for ${finalDamage} damage`);

            if (onHit) {
                onHit(hit, finalDamage, isHeadshot);
            }

            return {
                hit: true,
                mesh: hit.pickedMesh,
                point: hit.pickedPoint,
                distance: hit.distance,
                damage: finalDamage,
                isHeadshot,
            };
        }

        return { hit: false };
    }
}
