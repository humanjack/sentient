import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Weapon } from '../../../src/combat/Weapon.js';

describe('Weapon', () => {
    let weapon;
    beforeEach(() => {
        vi.spyOn(performance, 'now').mockReturnValue(0);
        weapon = new Weapon({ name: 'TestGun', damage: 20, fireRate: 200, maxAmmo: 10, reloadTime: 1000 });
    });

    describe('canFire', () => {
        it('returns true when ready', () => {
            performance.now.mockReturnValue(1000);
            expect(weapon.canFire()).toBe(true);
        });
        it('respects fire rate', () => {
            performance.now.mockReturnValue(1000);
            weapon.fire();
            performance.now.mockReturnValue(1100);
            expect(weapon.canFire()).toBe(false);
            performance.now.mockReturnValue(1200);
            expect(weapon.canFire()).toBe(true);
        });
        it('returns false when no ammo', () => { weapon.currentAmmo = 0; expect(weapon.canFire()).toBe(false); });
        it('returns false when reloading', () => { weapon.isReloading = true; expect(weapon.canFire()).toBe(false); });
    });

    describe('fire', () => {
        it('decrements ammo', () => { performance.now.mockReturnValue(1000); weapon.fire(); expect(weapon.currentAmmo).toBe(9); });
        it('sets lastFireTime', () => { performance.now.mockReturnValue(500); weapon.fire(); expect(weapon.lastFireTime).toBe(500); });
        it('calls onFire callback', () => {
            const cb = vi.fn(); weapon.onFire = cb;
            performance.now.mockReturnValue(1000); weapon.fire();
            expect(cb).toHaveBeenCalledWith(weapon);
        });
    });

    describe('reload', () => {
        it('sets isReloading', () => { weapon.currentAmmo = 5; performance.now.mockReturnValue(0); weapon.reload(); expect(weapon.isReloading).toBe(true); });
        it('does not reload when full', () => { weapon.reload(); expect(weapon.isReloading).toBe(false); });
    });

    describe('update', () => {
        it('completes reload after reloadTime', () => {
            weapon.currentAmmo = 0; performance.now.mockReturnValue(0); weapon.reload();
            performance.now.mockReturnValue(999); weapon.update(); expect(weapon.isReloading).toBe(true);
            performance.now.mockReturnValue(1000); weapon.update(); expect(weapon.isReloading).toBe(false); expect(weapon.currentAmmo).toBe(10);
        });
    });

    describe('refillAmmo', () => {
        it('sets ammo to max', () => { weapon.currentAmmo = 2; weapon.refillAmmo(); expect(weapon.currentAmmo).toBe(10); expect(weapon.isReloading).toBe(false); });
    });

    describe('getAmmoString', () => {
        it('returns ammo count', () => { expect(weapon.getAmmoString()).toBe('10/10'); });
        it('returns RELOADING when reloading', () => { weapon.currentAmmo = 5; performance.now.mockReturnValue(0); weapon.reload(); expect(weapon.getAmmoString()).toBe('RELOADING'); });
    });
});
