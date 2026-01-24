/**
 * Settings.js - Game settings management with localStorage persistence.
 */
export class Settings {
    static instance = null;

    static getInstance() {
        if (!Settings.instance) {
            Settings.instance = new Settings();
        }
        return Settings.instance;
    }

    constructor() {
        // Default settings
        this.defaults = {
            controlScheme: 'arrows', // 'arrows' or 'wasd'
            musicVolume: 0.5,
            sfxVolume: 0.8,
        };

        // Load settings from localStorage or use defaults
        this.settings = this.load();

        console.log('Settings initialized:', this.settings);
    }

    /**
     * Load settings from localStorage.
     * @returns {Object} Settings object
     */
    load() {
        try {
            const saved = localStorage.getItem('enemyEyesSettings');
            if (saved) {
                return { ...this.defaults, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        return { ...this.defaults };
    }

    /**
     * Save settings to localStorage.
     */
    save() {
        try {
            localStorage.setItem('enemyEyesSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    /**
     * Get a setting value.
     * @param {string} key - Setting key
     * @returns {*} Setting value
     */
    get(key) {
        return this.settings[key] ?? this.defaults[key];
    }

    /**
     * Set a setting value.
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    set(key, value) {
        this.settings[key] = value;
        this.save();
    }

    /**
     * Get control scheme ('arrows' or 'wasd').
     * @returns {string}
     */
    getControlScheme() {
        return this.get('controlScheme');
    }

    /**
     * Set control scheme.
     * @param {string} scheme - 'arrows' or 'wasd'
     */
    setControlScheme(scheme) {
        if (scheme === 'arrows' || scheme === 'wasd') {
            this.set('controlScheme', scheme);
            console.log(`Control scheme set to: ${scheme}`);
        }
    }

    /**
     * Toggle control scheme between arrows and wasd.
     * @returns {string} New control scheme
     */
    toggleControlScheme() {
        const current = this.getControlScheme();
        const newScheme = current === 'arrows' ? 'wasd' : 'arrows';
        this.setControlScheme(newScheme);
        return newScheme;
    }

    /**
     * Reset all settings to defaults.
     */
    reset() {
        this.settings = { ...this.defaults };
        this.save();
    }
}
