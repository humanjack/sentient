import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreManager } from '../../src/gameflow/ScoreManager.js';

describe('Economy Integration', () => {
    let sm;
    beforeEach(() => { sm = new ScoreManager(); });

    it('earn credits then purchase deducts correctly', () => {
        sm.addCredits(2000);
        expect(sm.spendCredits(800)).toBe(true);
        expect(sm.credits).toBe(1200);
        expect(sm.spendCredits(1500)).toBe(false);
        expect(sm.credits).toBe(1200);
    });
});
