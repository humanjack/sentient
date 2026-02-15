import { vi } from 'vitest';

if (typeof performance === 'undefined') {
    global.performance = { now: () => Date.now() };
}

vi.mock('@babylonjs/core/Maths/math.vector', () => ({
    Vector3: class Vector3 {
        constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
        clone() { return new Vector3(this.x, this.y, this.z); }
        add(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
        subtract(v) { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }
        scale(s) { return new Vector3(this.x * s, this.y * s, this.z * s); }
        normalize() { const l = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)||1; return new Vector3(this.x/l,this.y/l,this.z/l); }
        length() { return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z); }
        addInPlace(v) { this.x+=v.x;this.y+=v.y;this.z+=v.z; return this; }
        static Zero() { return new Vector3(0,0,0); }
    }
}));

vi.mock('@babylonjs/core/Maths/math.color', () => ({
    Color3: class { constructor(r=0,g=0,b=0){this.r=r;this.g=g;this.b=b;} },
    Color4: class { constructor(r=0,g=0,b=0,a=1){this.r=r;this.g=g;this.b=b;this.a=a;} }
}));

vi.mock('@babylonjs/core/Culling/ray', () => ({
    Ray: class { constructor(o,d,l){this.origin=o;this.direction=d;this.length=l;} }
}));

vi.mock('@babylonjs/core/Meshes/meshBuilder', () => ({
    MeshBuilder: {
        CreateSphere: () => ({ position:{x:0,y:0,z:0,addInPlace:vi.fn()}, dispose:vi.fn(), material:null }),
        CreateBox: () => ({ position:{x:0,y:0,z:0}, dispose:vi.fn(), material:null }),
    }
}));

vi.mock('@babylonjs/core/Materials/standardMaterial', () => ({
    StandardMaterial: class { constructor(){this.diffuseColor=null;this.emissiveColor=null;} }
}));

vi.mock('../src/audio/AudioManager.js', () => ({
    AudioManager: { getInstance: () => ({ playSound: vi.fn() }) }
}));

vi.mock('@babylonjs/core', () => ({}));
vi.mock('@babylonjs/gui', () => ({}));
vi.mock('@babylonjs/loaders', () => ({}));
