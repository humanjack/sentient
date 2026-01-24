/**
 * Main entry point for Enemy Eyes game.
 */
import { Engine } from '@babylonjs/core/Engines/engine';
import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    const engine = new Engine(canvas, true);
    const game = new Game(engine, canvas);

    // Make game accessible for debugging
    window.game = game;

    engine.runRenderLoop(() => {
        game.update();
        game.render();
    });

    window.addEventListener('resize', () => engine.resize());
});
