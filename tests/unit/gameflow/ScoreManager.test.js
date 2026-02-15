import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreManager } from '../../../src/gameflow/ScoreManager.js';

describe('ScoreManager', () => {
    let sm;
    beforeEach(() => { sm = new ScoreManager(); });

    it('singleton', () => { expect(ScoreManager.getInstance()).toBe(sm); });
    it('addScore', () => { sm.addScore(100); expect(sm.score).toBe(100); sm.addScore(50); expect(sm.score).toBe(150); });
    it('addCredits', () => { sm.addCredits(500); expect(sm.credits).toBe(500); });
    it('spendCredits returns true and deducts', () => { sm.addCredits(1000); expect(sm.spendCredits(400)).toBe(true); expect(sm.credits).toBe(600); });
    it('spendCredits returns false when insufficient', () => { sm.addCredits(100); expect(sm.spendCredits(200)).toBe(false); expect(sm.credits).toBe(100); });
});
