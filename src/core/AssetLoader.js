/**
 * AssetLoader.js - Loads and caches 3D model assets (GLB format).
 * Provides loaded meshes as templates that can be cloned for game entities.
 * Uses Babylon.js SceneLoader with @babylonjs/loaders for GLB support.
 */
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';

// Singleton instance
let instance = null;

/**
 * Asset manifest - maps logical names to model file paths.
 * All paths are relative to the models/ directory served from dist/models/.
 */
const ASSET_MANIFEST = {
    // Player characters
    'player': 'characters/player.glb',
    'player_blaze': 'characters/player_blaze.glb',
    'player_frost': 'characters/player_frost.glb',
    'player_shadow': 'characters/player_shadow.glb',

    // Enemies
    'enemy_grunt': 'enemies/grunt.glb',
    'enemy_soldier': 'enemies/soldier.glb',
    'enemy_sniper': 'enemies/sniper.glb',
    'enemy_heavy': 'enemies/heavy.glb',
    'enemy_boss': 'enemies/boss.glb',

    // Weapons
    'weapon_pistol': 'weapons/pistol.glb',
    'weapon_rifle': 'weapons/rifle.glb',
    'weapon_shotgun': 'weapons/shotgun.glb',
    'weapon_smg': 'weapons/smg.glb',
    'weapon_sniper_rifle': 'weapons/sniper_rifle.glb',
    'weapon_rocket_launcher': 'weapons/rocket_launcher.glb',

    // Environment
    'env_barrel': 'environment/barrel.glb',
    'env_crate': 'environment/crate.glb',
    'env_wall': 'environment/wall.glb',
    'env_pillar': 'environment/pillar.glb',
};

/**
 * Scale factors for each asset to fit the game world properly.
 * Calculated from raw model heights to match game expectations:
 *   Player ~2 units tall, Grunt ~2, Soldier ~2.5, Sniper ~2.2,
 *   Heavy ~3, Boss ~4, Weapons ~0.5-0.8, Barrel ~1.5, Wall ~4
 */
const ASSET_SCALES = {
    'player': 2.5,          // raw 0.79 → target 2.0
    'player_blaze': 2.5,    // raw 0.79 → target 2.0
    'player_frost': 2.5,    // raw 0.79 → target 2.0
    'player_shadow': 2.5,   // same character model
    'enemy_grunt': 2.4,     // raw 0.84 → target 2.0
    'enemy_soldier': 3.0,   // raw 0.84 → target 2.5
    'enemy_sniper': 2.4,    // raw 0.90 → target 2.2
    'enemy_heavy': 4.3,     // raw 0.70 → target 3.0
    'enemy_boss': 3.0,      // raw 1.34 → target 4.0
    'weapon_pistol': 3.0,
    'weapon_rifle': 3.0,
    'weapon_shotgun': 3.0,
    'weapon_smg': 3.0,
    'weapon_sniper_rifle': 3.0,
    'weapon_rocket_launcher': 3.0,
    'env_barrel': 6.0,      // raw 0.25 → target 1.5
    'env_crate': 2.0,
    'env_wall': 4.0,        // raw 1.0 → target 4.0
    'env_pillar': 1.0,
};

export class AssetLoader {
    constructor(scene) {
        this.scene = scene;
        this.loadedAssets = new Map(); // name -> { meshes, rootMesh }
        this.loading = false;
        this.loaded = false;
    }

    static getInstance(scene) {
        if (!instance && scene) {
            instance = new AssetLoader(scene);
        }
        return instance;
    }

    static resetInstance() {
        instance = null;
    }

    /**
     * Preload all assets from the manifest.
     * Loads sequentially to avoid blob URL race conditions with textures.
     * @returns {Promise<void>}
     */
    async preloadAll() {
        if (this.loaded || this.loading) return;
        this.loading = true;

        console.log('[AssetLoader] Starting asset preload...');
        const entries = Object.entries(ASSET_MANIFEST);
        let loaded = 0;
        let failed = 0;

        const promises = entries.map(async ([name, path]) => {
            try {
                const result = await SceneLoader.ImportMeshAsync(
                    '', 'models/', path, this.scene
                );

                // Hide template meshes
                const rootMesh = result.meshes[0];
                rootMesh.setEnabled(false);
                rootMesh.name = `__template_${name}`;

                // Apply default scale
                const scale = ASSET_SCALES[name] || 1.0;
                rootMesh.scaling.setAll(scale);

                this.loadedAssets.set(name, {
                    meshes: result.meshes,
                    rootMesh: rootMesh,
                    animationGroups: result.animationGroups || [],
                    skeletons: result.skeletons || [],
                });

                loaded++;
                console.log(`[AssetLoader] Loaded: ${name} (${result.meshes.length} meshes)`);
            } catch (err) {
                failed++;
                console.warn(`[AssetLoader] Failed to load ${name}: ${err.message}`);
            }
        });

        await Promise.all(promises);
        this.loaded = true;
        this.loading = false;
        console.log(`[AssetLoader] Preload complete: ${loaded} loaded, ${failed} failed`);
    }

    /**
     * Create a clone of a loaded asset.
     * @param {string} name - Asset name from manifest
     * @param {string} instanceName - Unique name for the clone
     * @returns {Mesh|null} Cloned root mesh, or null if asset not loaded
     */
    createInstance(name, instanceName) {
        const asset = this.loadedAssets.get(name);
        if (!asset) {
            console.warn(`[AssetLoader] Asset not loaded: ${name}`);
            return null;
        }

        const clone = asset.rootMesh.clone(instanceName, null);
        clone.setEnabled(true);

        // Enable all child meshes too
        clone.getChildMeshes().forEach(child => {
            child.setEnabled(true);
        });

        return clone;
    }

    /**
     * Check if an asset is available.
     * @param {string} name
     * @returns {boolean}
     */
    hasAsset(name) {
        return this.loadedAssets.has(name);
    }

    /**
     * Get the asset manifest.
     * @returns {Object}
     */
    static getManifest() {
        return { ...ASSET_MANIFEST };
    }

    /**
     * Get scale for an asset.
     * @param {string} name
     * @returns {number}
     */
    static getScale(name) {
        return ASSET_SCALES[name] || 1.0;
    }
}
