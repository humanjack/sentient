/**
 * ScoreManager.js - Manages score and credits (economy).
 * Singleton for easy access from anywhere.
 */
export class ScoreManager {
    // Singleton instance
    static instance = null;

    static getInstance() {
        return ScoreManager.instance;
    }

    /**
     * Create score manager.
     * @param {Object} options
     * @param {function} options.onScoreChanged - Called when score changes
     * @param {function} options.onCreditsChanged - Called when credits change
     */
    constructor(options = {}) {
        // Singleton
        ScoreManager.instance = this;

        // Score (display points)
        this.score = 0;

        // Credits (currency for buying)
        this.credits = 0;

        // Callbacks
        this.onScoreChanged = options.onScoreChanged || null;
        this.onCreditsChanged = options.onCreditsChanged || null;

        // Kill rewards by enemy type
        this.killRewards = {
            grunt: { score: 100, credits: 100 },
            soldier: { score: 200, credits: 200 },
            sniper: { score: 250, credits: 250 },
            heavy: { score: 300, credits: 300 },
            boss: { score: 1000, credits: 1000 },
        };

        console.log('ScoreManager initialized');
    }

    /**
     * Add points and credits for killing an enemy.
     * @param {string} enemyType - Type of enemy killed
     * @returns {Object} - The reward given { score, credits }
     */
    addKill(enemyType) {
        const type = enemyType.toLowerCase();
        const reward = this.killRewards[type] || this.killRewards.grunt;

        this.score += reward.score;
        this.credits += reward.credits;

        console.log(`Kill reward: +${reward.score} score, +${reward.credits} credits`);

        // Notify listeners
        if (this.onScoreChanged) {
            this.onScoreChanged(this.score);
        }
        if (this.onCreditsChanged) {
            this.onCreditsChanged(this.credits);
        }

        return reward;
    }

    /**
     * Add wave completion bonus.
     * @param {number} waveNumber - The completed wave number
     * @returns {number} - Bonus points added
     */
    addWaveBonus(waveNumber) {
        const bonus = waveNumber * 500;
        this.score += bonus;

        console.log(`Wave ${waveNumber} bonus: +${bonus} score`);

        if (this.onScoreChanged) {
            this.onScoreChanged(this.score);
        }

        return bonus;
    }

    /**
     * Add arbitrary score.
     * @param {number} amount
     */
    addScore(amount) {
        if (amount <= 0) return;

        this.score += amount;

        if (this.onScoreChanged) {
            this.onScoreChanged(this.score);
        }
    }

    /**
     * Add arbitrary credits.
     * @param {number} amount
     */
    addCredits(amount) {
        if (amount <= 0) return;

        this.credits += amount;

        if (this.onCreditsChanged) {
            this.onCreditsChanged(this.credits);
        }
    }

    /**
     * Spend credits. Returns true if successful.
     * @param {number} amount - Amount to spend
     * @returns {boolean} - True if purchase successful
     */
    spendCredits(amount) {
        if (amount <= 0) return true;
        if (this.credits < amount) {
            console.log(`Not enough credits! Need ${amount}, have ${this.credits}`);
            return false;
        }

        this.credits -= amount;

        console.log(`Spent ${amount} credits. Remaining: ${this.credits}`);

        if (this.onCreditsChanged) {
            this.onCreditsChanged(this.credits);
        }

        return true;
    }

    /**
     * Check if player can afford something.
     * @param {number} amount
     * @returns {boolean}
     */
    canAfford(amount) {
        return this.credits >= amount;
    }

    /**
     * Get current score.
     * @returns {number}
     */
    getScore() {
        return this.score;
    }

    /**
     * Get current credits.
     * @returns {number}
     */
    getCredits() {
        return this.credits;
    }

    /**
     * Reset score and credits.
     */
    reset() {
        this.score = 0;
        this.credits = 0;

        if (this.onScoreChanged) {
            this.onScoreChanged(this.score);
        }
        if (this.onCreditsChanged) {
            this.onCreditsChanged(this.credits);
        }
    }
}
