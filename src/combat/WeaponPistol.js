/**
 * WeaponPistol.js - Starting pistol with infinite ammo.
 * From GAME_SPEC: Infinite ammo, 25 damage
 */
import { Ray } from '@babylonjs/core/Culling/ray';
import { Weapon } from './Weapon.js';

export class WeaponPistol extends Weapon {
    constructor(options = {}) {
        super({
            name: 'Pistol',
            damage: 25,
            fireRate: 400, // Slower than rifle
            maxAmmo: Infinity,
            reloadTime: 0, // Never reloads
            ...options,
        });

        this.range = 100;
        this.currentAmmo = Infinity;
    }

    /**
     * Check if weapon can fire.
     * @returns {boolean}
     */
    canFire() {
        // Pistol never runs out of ammo
        if (this.isReloading) return false;

        const now = performance.now();
        if (now - this.lastFireTime < this.fireRate) return false;

        return true;
    }

    /**
     * Fire the pistol.
     */
    fire(origin, direction, scene, onHit) {
        if (!this.canFire()) {
            return null;
        }

        // Don't decrement ammo - it's infinite
        this.lastFireTime = performance.now();

        if (this.onFire) {
            this.onFire(this);
        }

        // Create ray
        const ray = new Ray(origin, direction, this.range);

        // Raycast
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
            // Headshot detection
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
            } catch (e) { /* ignore */ }

            console.log(`Pistol ${isHeadshot ? 'HEADSHOT' : 'hit'}: ${hit.pickedMesh.name}`);

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

    /**
     * Pistol never needs reload.
     */
    reload() {
        // Do nothing
    }

    /**
     * Get ammo display string.
     * @returns {string}
     */
    getAmmoString() {
        return '∞';
    }
}
