import { describe, it, expect, vi } from 'vitest';
vi.mock('../../src/audio/AudioManager.js', () => ({ AudioManager: { getInstance: () => ({ playSound: vi.fn() }) } }));
import { ScoreManager } from '../../src/gameflow/ScoreManager.js';
import { WaveManager } from '../../src/gameflow/WaveManager.js';

describe('Game Simulation', () => {
    it('progress through wave states', () => {
        const sm = new ScoreManager();
        const spawner = { spawnWaveWithTypes:vi.fn(), spawnBoss:vi.fn(), getAliveCount:vi.fn(()=>0) };
        const wm = new WaveManager({ spawner });

        wm.startNextWave();
        expect(wm.waveState).toBe('inProgress');
        expect(wm.currentWave).toBe(1);

        for (let i = 0; i < wm.enemiesSpawned; i++) wm.onEnemyKilled();
        expect(wm.waveState).toBe('completed');

        wm.update(wm.waveCompletePauseDuration);
        expect(wm.waveState).toBe('buyPhase');

        sm.addScore(500); sm.addCredits(1000);
        expect(sm.score).toBe(1000); // 500 + wave bonus 500

        wm.endBuyPhase();
        expect(wm.currentWave).toBe(2);
        expect(wm.waveState).toBe('inProgress');
    });
});
