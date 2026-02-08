/**
 * AgentBlaze.js - "Blaze" agent definition.
 * Fire-themed agent with offensive abilities.
 */
export const AgentBlaze = {
    id: 'blaze',
    name: 'Blaze',
    color: { r: 1, g: 0.4, b: 0.1 },
    emissiveColor: { r: 0.4, g: 0.15, b: 0 },
    description: 'Fire-themed duelist. Burns everything in his path.',
    stats: {
        health: 100,
        shield: 50,
        moveSpeed: 5,
        sprintSpeed: 8,
    },
    abilities: {
        Q: {
            name: 'Flash Bang',
            description: 'Blinds and stuns enemies in radius',
            cooldown: 15,
            key: 'Q',
        },
        E: {
            name: 'Dash',
            description: 'Quick dodge in movement direction',
            cooldown: 8,
            key: 'E',
        },
        C: {
            name: 'Fire Wall',
            description: 'Creates burning barrier that damages enemies',
            cooldown: 20,
            key: 'C',
        },
        X: {
            name: 'Inferno',
            description: 'Massive fire explosion around player',
            chargeKills: 10,
            key: 'X',
            isUltimate: true,
        },
    },
};
