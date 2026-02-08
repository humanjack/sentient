/**
 * Main entry point for Enemy Eyes game.
 */
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Game } from './core/Game.js';
import { AssetLoader } from './core/AssetLoader.js';
import { LoadingScreen } from './ui/LoadingScreen.js';

window.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const engine = new Engine(canvas, true);

    // Show loading screen and preload assets
    const loadingScreen = new LoadingScreen();

    try {
        // Create a temporary scene for asset loading
        const tempScene = new Scene(engine);
        const assetLoader = AssetLoader.getInstance();
        await assetLoader.preloadAll(tempScene, (loaded, total, name) => {
            loadingScreen.update(loaded, total, name);
        });
        tempScene.dispose();
    } catch (err) {
        console.warn('Asset preloading encountered errors:', err);
    }

    // Create game (will use cached assets or fall back to geometric shapes)
    const game = new Game(engine, canvas);
    window.game = game;

    // Hide loading screen
    loadingScreen.hide();

    engine.runRenderLoop(() => {
        game.update();
        game.render();
    });

    window.addEventListener('resize', () => engine.resize());
});
