# Game Specification: "Enemy Eyes" — Wave Survival Shooter

## Overview

| Aspect | Choice |
|--------|--------|
| Camera | True Second-Person — view through enemy/environment perspectives |
| Mode | Wave Survival — defend against endless enemy waves |
| Engine | Babylon.js (JavaScript) |
| Platform | Web browser |
| Players | Single-player vs AI |

---

## True Second-Person Camera System

### How It Works
- The camera is NOT attached to the player
- Camera attaches to enemies, security cameras, or fixed points in the level
- You see your own character from the enemy's viewpoint
- Camera switches between viewpoints as enemies die or move

### Camera Sources (Priority Order)
1. Nearest alive enemy — see yourself through their eyes
2. Security cameras — fixed positions around the arena
3. Drone camera — fallback floating camera if no enemies exist

### Camera Behaviors
| Situation | Camera Behavior |
|-----------|-----------------|
| Enemies alive | Camera on closest enemy looking at player |
| Current camera enemy dies | Snap to next nearest enemy |
| No enemies (between waves) | Security camera or drone view |
| Boss fight | Camera on boss drone |

### Player Assists
- Player outline — subtle glow so you can always spot yourself
- Crosshair — still shows where you're aiming
- Minimap — helps with orientation
- Audio cues — directional sound for enemy positions

---

## Wave Survival Mode

### Wave Structure
[Wave Start] → [Enemies Spawn] → [Combat] → [All Enemies Dead] → [Wave Complete] → [Buy Phase: 15 seconds] → [Next Wave]

### Wave Progression
| Wave | Enemy Count | Enemy Types | Special |
|------|-------------|-------------|---------|
| 1-3 | 5-10 | Grunts only | Tutorial waves |
| 4-6 | 10-15 | Grunts + Soldiers | — |
| 7-9 | 15-20 | Add Snipers | Faster spawns |
| 10 | 10 + Boss | All types + Mini-boss | Boss wave |
| 11+ | Scaling | All types | Endless, increasing difficulty |

### Scoring
| Action | Points |
|--------|--------|
| Grunt kill | 100 |
| Soldier kill | 200 |
| Sniper kill | 250 |
| Heavy kill | 300 |
| Boss kill | 1000 |
| Wave clear bonus | Wave × 500 |
| No damage bonus | +50% wave score |

---

## Arena Design: "The Compound"

### Layout
- 50x50 unit arena with walls
- 4 enemy spawn points at edges (A, B, C, D)
- 3 security camera positions (elevated, looking down)
- Cover objects (crates, walls, pillars)
- Health/ammo pickup locations

---

## Player Agent: "Blaze"

### Stats
| Stat | Value |
|------|-------|
| Health | 100 |
| Shield | 50 (regenerates slowly) |
| Move Speed | 5 m/s |
| Sprint Speed | 8 m/s |

### Abilities
| Ability | Key | Description | Cooldown |
|---------|-----|-------------|----------|
| Flash Bang | Q | Blinds/stuns enemies in radius | 15 sec |
| Dash | E | Quick dodge in movement direction | 8 sec |
| Fire Wall | C | Creates burning barrier, damages enemies | 20 sec |
| Ultimate: Inferno | X | Massive fire explosion around player | 10 kills to charge |

---

## Enemy Types

### Grunt
- Health: 50
- Speed: Fast (4 m/s)
- Attack: Melee (runs at player, 10 damage)
- Camera view: Shaky, aggressive

### Soldier
- Health: 100
- Speed: Medium (3 m/s)
- Attack: Rifle, ranged (10 damage per shot)
- Behavior: Stops at range 10, shoots
- Camera view: Stable, tactical

### Sniper
- Health: 75
- Speed: Slow (2 m/s)
- Attack: High damage (25), slow fire rate
- Behavior: Stays at distance (range 20+)
- Camera view: Zoomed, focused

### Heavy
- Health: 200
- Speed: Very slow (2 m/s)
- Attack: Melee (25 damage)
- Behavior: Walks directly at player
- Camera view: Low angle, intimidating

### Mini-Boss: "Watcher"
- Health: 500
- Attacks: Laser beam, spawn minions, ground slam
- Special: Has drone camera (priority 0)
- Camera view: Drone gives overhead perspective

---

## Weapons

### Starting Loadout
- Pistol (infinite ammo, 25 damage)
- Rifle (30 ammo, 35 damage)

### Buyable Weapons
| Weapon | Price | Damage | Fire Rate | Ammo |
|--------|-------|--------|-----------|------|
| Shotgun | 800 | 15×6 pellets | Slow | 8 |
| SMG | 1200 | 15 | Very fast | 45 |
| Sniper Rifle | 1500 | 100 | Very slow | 5 |
| Rocket Launcher | 2000 | 150 (AOE) | Slow | 3 |

---

## Buy System

### Between Waves (15 seconds)
| Item | Price | Effect |
|------|-------|--------|
| Ammo Refill | 200 | Full ammo all weapons |
| Health Pack | 400 | Restore 50 health |
| Shield Recharge | 300 | Restore 50 shield |
| Ability Refresh | 500 | Reset all cooldowns |
| Shotgun | 800 | Unlock shotgun |
| SMG | 1200 | Unlock SMG |

### Economy
- Kill grant: 100 credits per enemy (varies by type)
- Wave clear: bonus credits

---

## Controls

| Action | Key |
|--------|-----|
| Move | WASD |
| Look/Aim | Mouse |
| Shoot | Left Click |
| Ability 1 (Flash) | Q |
| Ability 2 (Dash) | E |
| Ability 3 (Fire Wall) | C |
| Ultimate | X |
| Reload | R |
| Sprint | Shift |
| Switch Weapon | 1-4 |
| Buy Menu | B |
| Pause | Escape |
```
