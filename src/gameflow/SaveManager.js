/**
 * SaveManager.js - Handles saving/loading high scores using localStorage.
 * Singleton for easy access.
 */
export class SaveManager {
    // Singleton instance
    static instance = null;

    static getInstance() {
        if (!SaveManager.instance) {
            SaveManager.instance = new SaveManager();
        }
        return SaveManager.instance;
    }

    constructor() {
        // Storage keys
        this.STORAGE_PREFIX = 'enemyEyes_';
        this.HIGH_SCORE_KEY = this.STORAGE_PREFIX + 'highScore';
        this.HIGH_WAVE_KEY = this.STORAGE_PREFIX + 'highWave';
        this.TOTAL_KILLS_KEY = this.STORAGE_PREFIX + 'totalKills';
        this.GAMES_PLAYED_KEY = this.STORAGE_PREFIX + 'gamesPlayed';
        this.FIRST_PLAY_KEY = this.STORAGE_PREFIX + 'firstPlay';

        console.log('SaveManager initialized');
    }

    /**
     * Save high score if it's better than existing.
     * @param {number} score - Score achieved
     * @param {number} wave - Wave reached
     * @returns {boolean} - True if new high score
     */
    saveHighScore(score, wave) {
        const currentHigh = this.loadHighScore();

        let isNewHigh = false;

        // Check if new high score
        if (score > currentHigh.score) {
            localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
            isNewHigh = true;
            console.log(`New high score: ${score}`);
        }

        // Check if new high wave
        if (wave > currentHigh.wave) {
            localStorage.setItem(this.HIGH_WAVE_KEY, wave.toString());
            console.log(`New high wave: ${wave}`);
            isNewHigh = true;
        }

        // Increment games played
        const gamesPlayed = parseInt(localStorage.getItem(this.GAMES_PLAYED_KEY) || '0');
        localStorage.setItem(this.GAMES_PLAYED_KEY, (gamesPlayed + 1).toString());

        return isNewHigh;
    }

    /**
     * Load high score data.
     * @returns {Object} - { score, wave }
     */
    loadHighScore() {
        const score = parseInt(localStorage.getItem(this.HIGH_SCORE_KEY) || '0');
        const wave = parseInt(localStorage.getItem(this.HIGH_WAVE_KEY) || '0');

        return { score, wave };
    }

    /**
     * Get games played count.
     * @returns {number}
     */
    getGamesPlayed() {
        return parseInt(localStorage.getItem(this.GAMES_PLAYED_KEY) || '0');
    }

    /**
     * Check if this is the first time playing.
     * @returns {boolean}
     */
    isFirstPlay() {
        const firstPlay = localStorage.getItem(this.FIRST_PLAY_KEY);
        if (!firstPlay) {
            localStorage.setItem(this.FIRST_PLAY_KEY, 'false');
            return true;
        }
        return false;
    }

    /**
     * Add to total kills stat.
     * @param {number} kills
     */
    addKills(kills) {
        const totalKills = parseInt(localStorage.getItem(this.TOTAL_KILLS_KEY) || '0');
        localStorage.setItem(this.TOTAL_KILLS_KEY, (totalKills + kills).toString());
    }

    /**
     * Get total kills.
     * @returns {number}
     */
    getTotalKills() {
        return parseInt(localStorage.getItem(this.TOTAL_KILLS_KEY) || '0');
    }

    /**
     * Clear all saved data.
     */
    clearData() {
        localStorage.removeItem(this.HIGH_SCORE_KEY);
        localStorage.removeItem(this.HIGH_WAVE_KEY);
        localStorage.removeItem(this.TOTAL_KILLS_KEY);
        localStorage.removeItem(this.GAMES_PLAYED_KEY);
        localStorage.removeItem(this.FIRST_PLAY_KEY);

        console.log('SaveManager data cleared');
    }

    /**
     * Get all stats.
     * @returns {Object}
     */
    getAllStats() {
        return {
            highScore: this.loadHighScore(),
            gamesPlayed: this.getGamesPlayed(),
            totalKills: this.getTotalKills(),
            isFirstPlay: this.isFirstPlay(),
        };
    }
}
