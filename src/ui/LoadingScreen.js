/**
 * LoadingScreen.js - Shows loading progress while assets preload.
 */
export class LoadingScreen {
    constructor() {
        this.container = null;
        this.progressBar = null;
        this.progressText = null;
        this.assetText = null;
        this._create();
    }

    _create() {
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%)',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            zIndex: '10000', fontFamily: 'monospace', color: '#fff',
        });

        // Title
        const title = document.createElement('div');
        title.textContent = '👁️ ENEMY EYES';
        Object.assign(title.style, {
            fontSize: '48px', fontWeight: 'bold', marginBottom: '40px',
            textShadow: '0 0 20px rgba(100, 150, 255, 0.5)',
            letterSpacing: '4px',
        });
        this.container.appendChild(title);

        // Progress bar container
        const barContainer = document.createElement('div');
        Object.assign(barContainer.style, {
            width: '400px', height: '8px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px', overflow: 'hidden', marginBottom: '16px',
        });

        this.progressBar = document.createElement('div');
        Object.assign(this.progressBar.style, {
            width: '0%', height: '100%',
            background: 'linear-gradient(90deg, #4488ff, #66bbff)',
            borderRadius: '4px',
            transition: 'width 0.2s ease',
        });
        barContainer.appendChild(this.progressBar);
        this.container.appendChild(barContainer);

        // Progress text
        this.progressText = document.createElement('div');
        this.progressText.textContent = 'Loading assets...';
        Object.assign(this.progressText.style, { fontSize: '16px', marginBottom: '8px' });
        this.container.appendChild(this.progressText);

        // Asset name text
        this.assetText = document.createElement('div');
        this.assetText.textContent = '';
        Object.assign(this.assetText.style, { fontSize: '12px', color: 'rgba(255,255,255,0.5)' });
        this.container.appendChild(this.assetText);

        document.body.appendChild(this.container);
    }

    /**
     * Update progress display.
     * @param {number} loaded
     * @param {number} total
     * @param {string} assetName
     */
    update(loaded, total, assetName) {
        const pct = Math.round((loaded / total) * 100);
        this.progressBar.style.width = `${pct}%`;
        this.progressText.textContent = `Loading assets... ${pct}%`;
        this.assetText.textContent = assetName || '';
    }

    /**
     * Remove the loading screen with a fade.
     */
    hide() {
        this.container.style.transition = 'opacity 0.5s ease';
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.container.remove();
        }, 500);
    }
}
