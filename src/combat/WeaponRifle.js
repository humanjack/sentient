/**
 * WeaponRifle.js - Standard rifle weapon.
 * From GAME_SPEC: 30 ammo, 35 damage
 */
import { Ray } from '@babylonjs/core/Culling/ray';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Weapon } from './Weapon.js';

export class WeaponRifle extends Weapon {
    constructor(options = {}) {
        super({
            name: 'Rifle',
            damage: 35,
            fireRate: 150, // Fast fire rate
            maxAmmo: 30,
            reloadTime: 1500,
            ...options,
        });

        this.range = 100; // Max raycast distance
    }

    /**
     * Fire the rifle using raycasting.
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
            // Don't hit ground, walls, player, or UI elements
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
            // Headshot detection: hit in upper 25% of mesh
            let isHeadshot = false;
            let finalDamage = this.damage;
            try {
                const meshBounds = hit.pickedMesh.getBoundingInfo();
                const meshTop = meshBounds.boundingBox.maximumWorld.y;
                const meshBottom = meshBounds.boundingBox.minimumWorld.y;
                const meshHeight = meshTop - meshBottom;
                const hitHeight = hit.pickedPoint.y - meshBottom;
                isHeadshot = hitHeight > meshHeight * 0.75;
                if (isHeadshot) finalDamage = Math.floor(this.damage * 1.5);
            } catch (e) { /* ignore bounds errors */ }

            console.log(`Rifle ${isHeadshot ? 'HEADSHOT' : 'hit'}: ${hit.pickedMesh.name} for ${finalDamage}`);

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

        console.log('Rifle shot missed');
        return { hit: false };
    }
}
