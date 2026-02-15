import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeaponPistol } from '../../../src/combat/WeaponPistol.js';
import { WeaponShotgun } from '../../../src/combat/WeaponShotgun.js';
import { WeaponSniper } from '../../../src/combat/WeaponSniper.js';
import { WeaponRocketLauncher } from '../../../src/combat/WeaponRocketLauncher.js';
import { WeaponRifle } from '../../../src/combat/WeaponRifle.js';
import { WeaponSMG } from '../../../src/combat/WeaponSMG.js';

beforeEach(() => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
});

describe('WeaponPistol', () => {
    it('has correct stats', () => {
        const w = new WeaponPistol();
        expect(w.damage).toBe(25);
        expect(w.fireRate).toBe(400);
        expect(w.maxAmmo).toBe(Infinity);
        // reloadTime: 0 || 1500 in base constructor, but pistol overrides reload()
        expect(w.reloadTime).toBe(1500);
        expect(w.range).toBe(100);
    });
    it('has infinite ammo and never reloads', () => {
        const w = new WeaponPistol();
        expect(w.currentAmmo).toBe(Infinity);
        w.reload(); // should do nothing
        expect(w.isReloading).toBe(false);
    });
    it('getAmmoString returns ∞', () => {
        expect(new WeaponPistol().getAmmoString()).toBe('∞');
    });
});

describe('WeaponShotgun', () => {
    it('has correct stats', () => {
        const w = new WeaponShotgun();
        expect(w.damage).toBe(15);
        expect(w.fireRate).toBe(800);
        expect(w.maxAmmo).toBe(8);
        expect(w.reloadTime).toBe(2000);
        expect(w.range).toBe(30);
    });
    it('has 6 pellets', () => {
        expect(new WeaponShotgun().pelletCount).toBe(6);
    });
});

describe('WeaponSniper', () => {
    it('has correct stats', () => {
        const w = new WeaponSniper();
        expect(w.damage).toBe(100);
        expect(w.fireRate).toBe(1200);
        expect(w.maxAmmo).toBe(5);
        expect(w.reloadTime).toBe(2500);
        expect(w.range).toBe(200);
    });
    it('has 2.5x headshot multiplier', () => {
        expect(new WeaponSniper().headshotMultiplier).toBe(2.5);
    });
});

describe('WeaponRocketLauncher', () => {
    it('has correct stats', () => {
        const w = new WeaponRocketLauncher();
        expect(w.damage).toBe(150);
        expect(w.fireRate).toBe(1500);
        expect(w.maxAmmo).toBe(3);
        expect(w.reloadTime).toBe(3000);
        expect(w.range).toBe(100);
    });
    it('has blastRadius 8', () => {
        expect(new WeaponRocketLauncher().blastRadius).toBe(8);
    });
});

describe('WeaponRifle', () => {
    it('has correct stats', () => {
        const w = new WeaponRifle();
        expect(w.damage).toBe(35);
        expect(w.fireRate).toBe(150);
        expect(w.maxAmmo).toBe(30);
        expect(w.reloadTime).toBe(1500);
        expect(w.range).toBe(100);
    });
});

describe('WeaponSMG', () => {
    it('has correct stats', () => {
        const w = new WeaponSMG();
        expect(w.damage).toBe(15);
        expect(w.fireRate).toBe(80);
        expect(w.maxAmmo).toBe(45);
        expect(w.reloadTime).toBe(1800);
        expect(w.range).toBe(60);
    });
});
