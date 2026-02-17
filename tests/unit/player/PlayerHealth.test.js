import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AudioManager before importing PlayerHealth
vi.mock('../../../src/audio/AudioManager.js', () => ({
    AudioManager: { getInstance: () => ({ playSound: vi.fn() }) }
}));

import { PlayerHealth } from '../../../src/player/PlayerHealth.js';

describe('PlayerHealth', () => {
    let ph;

    beforeEach(() => { ph = new PlayerHealth(); });

    it('initializes with 100 hp and 50 shield', () => {
        expect(ph.currentHealth).toBe(100);
        expect(ph.maxHealth).toBe(100);
        expect(ph.currentShield).toBe(50);
        expect(ph.maxShield).toBe(50);
    });

    describe('takeDamage', () => {
        it('shield absorbs first', () => {
            ph.takeDamage(30);
            expect(ph.currentShield).toBe(20);
            expect(ph.currentHealth).toBe(100);
        });

        it('overflow goes to health', () => {
            ph.takeDamage(70);
            expect(ph.currentShield).toBe(0);
            expect(ph.currentHealth).toBe(80);
        });

        it('death triggers onDeath', () => {
            const cb = vi.fn();
            ph.onDeath = cb;
            ph.takeDamage(200);
            expect(ph.isAlive).toBe(false);
            expect(cb).toHaveBeenCalled();
        });

        it('invincibility blocks damage', () => {
            ph.setInvincible(true);
            ph.takeDamage(100);
            expect(ph.currentHealth).toBe(100);
            expect(ph.currentShield).toBe(50);
        });
    });

    describe('heal', () => {
        it('restores health up to max', () => {
            ph.currentHealth = 50;
            ph.heal(30);
            expect(ph.currentHealth).toBe(80);
            ph.heal(50);
            expect(ph.currentHealth).toBe(100);
        });
    });
});
