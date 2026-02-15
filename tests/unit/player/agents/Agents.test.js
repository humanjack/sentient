import { describe, it, expect } from 'vitest';
import { AgentBlaze } from '../../../../src/player/agents/AgentBlaze.js';
import { AgentFrost } from '../../../../src/player/agents/AgentFrost.js';
import { AgentShadow } from '../../../../src/player/agents/AgentShadow.js';

const required = ['id','name','color','description','stats','abilities'];

describe('Agents', () => {
    for (const [n,a] of [['Blaze',AgentBlaze],['Frost',AgentFrost],['Shadow',AgentShadow]]) {
        describe(n, () => { it('has all required fields', () => { for (const f of required) expect(a[f]).toBeDefined(); }); });
    }
    it('Blaze has 100hp/50shield', () => { expect(AgentBlaze.stats.health).toBe(100); expect(AgentBlaze.stats.shield).toBe(50); });
    it('Frost has 75 shield', () => { expect(AgentFrost.stats.shield).toBe(75); });
    it('Shadow has 80hp/6 speed', () => { expect(AgentShadow.stats.health).toBe(80); expect(AgentShadow.stats.moveSpeed).toBe(6); });
});
