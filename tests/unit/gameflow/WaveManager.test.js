import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/audio/AudioManager.js', () => ({
    AudioManager: { getInstance: () => ({ playSound: vi.fn() }) }
}));

import { ScoreManager } from '../../../src/gameflow/ScoreManager.js';
import { WaveManager } from '../../../src/gameflow/WaveManager.js';

describe('WaveManager', () => {
    let wm, spawner;

    beforeEach(() => {
        new ScoreManager(); // set singleton
        spawner = {
            spawnWaveWithTypes: vi.fn(),
            spawnBoss: vi.fn(),
            getAliveCount: vi.fn(() => 0),
        };
        wm = new WaveManager({ spawner });
    });

    it('starts idle', () => {
        expect(wm.waveState).toBe('idle');
    });

    it('startNextWave transitions to inProgress', () => {
        wm.startNextWave();
        expect(wm.waveState).toBe('inProgress');
        expect(wm.currentWave).toBe(1);
    });

    it('onEnemyKilled transitions to completed when all dead', () => {
        wm.startNextWave();
        const total = wm.enemiesSpawned;
        for (let i = 0; i < total; i++) wm.onEnemyKilled();
        expect(wm.waveState).toBe('completed');
    });

    it('completed → buyPhase after pause', () => {
        wm.startNextWave();
        wm.enemiesRemaining = 0;
        wm.onWaveCleared();
        expect(wm.waveState).toBe('completed');
        wm.update(wm.waveCompletePauseDuration);
        expect(wm.waveState).toBe('buyPhase');
    });

    describe('getWaveComposition', () => {
        it('wave 1 has only grunts', () => {
            const comp = wm.getWaveComposition(1);
            expect(comp.grunt).toBeGreaterThan(0);
            expect(comp.soldier).toBeUndefined();
        });

        it('wave 5 has grunts and soldiers', () => {
            const comp = wm.getWaveComposition(5);
            expect(comp.grunt).toBeGreaterThan(0);
            expect(comp.soldier).toBeGreaterThan(0);
        });

        it('wave 10 has all types', () => {
            const comp = wm.getWaveComposition(10);
            expect(comp.grunt).toBeGreaterThan(0);
            expect(comp.heavy).toBeGreaterThan(0);
        });
    });
});
