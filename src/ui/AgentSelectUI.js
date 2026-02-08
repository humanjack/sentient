/**
 * AgentSelectUI.js - Agent selection screen before game starts.
 * Shows available agents with their abilities and lets player choose.
 */
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { StackPanel } from '@babylonjs/gui/2D/controls/stackPanel';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Ellipse } from '@babylonjs/gui/2D/controls/ellipse';
import { AgentBlaze } from '../player/agents/AgentBlaze.js';
import { AgentFrost } from '../player/agents/AgentFrost.js';
import { AgentShadow } from '../player/agents/AgentShadow.js';

export class AgentSelectUI {
    constructor(scene, onAgentSelected) {
        this.scene = scene;
        this.onAgentSelected = onAgentSelected;
        this.agents = [AgentBlaze, AgentFrost, AgentShadow];
        this.selectedIndex = 0;

        this.gui = AdvancedDynamicTexture.CreateFullscreenUI('AgentSelectUI', true, scene);
        this.createUI();
        this.hide();
    }

    createUI() {
        // Dark overlay
        this.overlay = new Rectangle('agentSelectOverlay');
        this.overlay.width = '100%';
        this.overlay.height = '100%';
        this.overlay.background = 'rgba(5, 10, 20, 0.95)';
        this.overlay.thickness = 0;
        this.gui.addControl(this.overlay);

        // Title
        const title = new TextBlock('agentSelectTitle');
        title.text = 'SELECT YOUR AGENT';
        title.color = '#44aaff';
        title.fontSize = 42;
        title.fontFamily = 'Courier New, monospace';
        title.fontWeight = 'bold';
        title.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        title.top = '40px';
        title.shadowColor = '#0044aa';
        title.shadowBlur = 10;
        this.gui.addControl(title);

        // Agent cards container (horizontal)
        this.cardsContainer = new StackPanel('agentCards');
        this.cardsContainer.isVertical = false;
        this.cardsContainer.width = '900px';
        this.cardsContainer.height = '450px';
        this.cardsContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.cardsContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.cardsContainer.top = '-20px';
        this.gui.addControl(this.cardsContainer);

        // Create a card for each agent
        this.cards = [];
        for (let i = 0; i < this.agents.length; i++) {
            this.createAgentCard(this.agents[i], i);
        }

        // Select button
        this.selectButton = Button.CreateSimpleButton('selectBtn', 'LOCK IN');
        this.selectButton.width = '200px';
        this.selectButton.height = '55px';
        this.selectButton.color = 'white';
        this.selectButton.background = '#44aa44';
        this.selectButton.fontSize = 24;
        this.selectButton.fontFamily = 'Courier New, monospace';
        this.selectButton.fontWeight = 'bold';
        this.selectButton.cornerRadius = 10;
        this.selectButton.thickness = 3;
        this.selectButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.selectButton.top = '-50px';
        this.selectButton.shadowColor = '#22aa22';
        this.selectButton.shadowBlur = 8;

        this.selectButton.onPointerEnterObservable.add(() => {
            this.selectButton.background = '#66cc66';
        });
        this.selectButton.onPointerOutObservable.add(() => {
            this.selectButton.background = '#44aa44';
        });
        this.selectButton.onPointerUpObservable.add(() => {
            if (this.onAgentSelected) {
                this.onAgentSelected(this.agents[this.selectedIndex]);
            }
        });
        this.gui.addControl(this.selectButton);

        // Highlight first agent
        this.highlightCard(0);
    }

    createAgentCard(agent, index) {
        const card = new Rectangle(`agentCard_${agent.id}`);
        card.width = '270px';
        card.height = '420px';
        card.background = 'rgba(20, 30, 50, 0.9)';
        card.thickness = 3;
        card.color = '#334466';
        card.cornerRadius = 12;
        card.paddingLeft = '10px';
        card.paddingRight = '10px';

        this.cardsContainer.addControl(card);

        // Agent color circle
        const colorCircle = new Ellipse(`agentColor_${agent.id}`);
        colorCircle.width = '80px';
        colorCircle.height = '80px';
        const r = Math.floor(agent.color.r * 255);
        const g = Math.floor(agent.color.g * 255);
        const b = Math.floor(agent.color.b * 255);
        colorCircle.background = `rgb(${r}, ${g}, ${b})`;
        colorCircle.thickness = 3;
        colorCircle.color = 'white';
        colorCircle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        colorCircle.top = '20px';
        card.addControl(colorCircle);

        // Agent name
        const nameText = new TextBlock(`agentName_${agent.id}`);
        nameText.text = agent.name.toUpperCase();
        nameText.color = `rgb(${r}, ${g}, ${b})`;
        nameText.fontSize = 28;
        nameText.fontFamily = 'Courier New, monospace';
        nameText.fontWeight = 'bold';
        nameText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        nameText.top = '110px';
        card.addControl(nameText);

        // Description
        const descText = new TextBlock(`agentDesc_${agent.id}`);
        descText.text = agent.description;
        descText.color = '#aaaacc';
        descText.fontSize = 14;
        descText.fontFamily = 'Courier New, monospace';
        descText.textWrapping = true;
        descText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        descText.top = '145px';
        descText.height = '40px';
        descText.width = '240px';
        card.addControl(descText);

        // Stats
        const statsText = new TextBlock(`agentStats_${agent.id}`);
        statsText.text = `HP: ${agent.stats.health} | Shield: ${agent.stats.shield}\nSpeed: ${agent.stats.moveSpeed}`;
        statsText.color = '#88aa88';
        statsText.fontSize = 13;
        statsText.fontFamily = 'Courier New, monospace';
        statsText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        statsText.top = '190px';
        statsText.height = '35px';
        card.addControl(statsText);

        // Abilities list
        let abilitiesStr = '';
        for (const [key, ability] of Object.entries(agent.abilities)) {
            const ultTag = ability.isUltimate ? ' [ULT]' : '';
            abilitiesStr += `[${key}] ${ability.name}${ultTag}\n`;
        }

        const abilitiesText = new TextBlock(`agentAbilities_${agent.id}`);
        abilitiesText.text = abilitiesStr.trim();
        abilitiesText.color = '#ccccdd';
        abilitiesText.fontSize = 14;
        abilitiesText.fontFamily = 'Courier New, monospace';
        abilitiesText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        abilitiesText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        abilitiesText.top = '240px';
        abilitiesText.left = '15px';
        abilitiesText.height = '100px';
        card.addControl(abilitiesText);

        // Click handler
        card.onPointerUpObservable.add(() => {
            this.selectedIndex = index;
            this.highlightCard(index);
        });

        card.onPointerEnterObservable.add(() => {
            if (this.selectedIndex !== index) {
                card.background = 'rgba(30, 40, 60, 0.9)';
            }
        });

        card.onPointerOutObservable.add(() => {
            if (this.selectedIndex !== index) {
                card.background = 'rgba(20, 30, 50, 0.9)';
                card.color = '#334466';
            }
        });

        this.cards.push({ card, agent, colorCircle });
    }

    highlightCard(index) {
        for (let i = 0; i < this.cards.length; i++) {
            const { card, agent } = this.cards[i];
            if (i === index) {
                const r = Math.floor(agent.color.r * 255);
                const g = Math.floor(agent.color.g * 255);
                const b = Math.floor(agent.color.b * 255);
                card.background = `rgba(${r}, ${g}, ${b}, 0.15)`;
                card.color = `rgb(${r}, ${g}, ${b})`;
                card.thickness = 4;
            } else {
                card.background = 'rgba(20, 30, 50, 0.9)';
                card.color = '#334466';
                card.thickness = 3;
            }
        }
    }

    show() {
        this.overlay.isVisible = true;
        this.cardsContainer.isVisible = true;
        this.selectButton.isVisible = true;
    }

    hide() {
        this.overlay.isVisible = false;
        this.cardsContainer.isVisible = false;
        this.selectButton.isVisible = false;
    }

    dispose() {
        this.gui.dispose();
    }
}
