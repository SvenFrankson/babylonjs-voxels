var MAX_LEVEL: number = 10;
var BLOCK_SIZE: number = 1;
var CHUNCK_LENGTH: number = 8;
var CHUNCK_SIZE: number = BLOCK_SIZE * CHUNCK_LENGTH;

class Chunck {

    public terrain: Terrain;

    public position: BABYLON.Vector3;
    public level: number = 0;
    public targetLevel: number = 0;
    public levelFactor: number = 0;
    public children: Chunck[] = [];
    public parent: Chunck;

    public mesh: BABYLON.Mesh;

    private _registered: boolean = false;
    public get registered(): boolean {
        return this._registered;
    }

    constructor(iPos: number, jPos: number, kPos: number, parent: Chunck);
    constructor(iPos: number, jPos: number, kPos: number, terrain: Terrain);
    constructor(
        public iPos: number = 0,
        public jPos: number = 0,
        public kPos: number = 0,
        arg1?: Chunck | Terrain
    ) {
        if (arg1 instanceof Terrain) {
            this.terrain = arg1;
        }
        if (arg1 instanceof Chunck) {
            this.parent = arg1;
            this.terrain = this.parent.terrain;
        }

        if (this.parent) {
            this.level = this.parent.level - 1;
            this.levelFactor = this.parent.levelFactor / 2;
        }
        else {
            this.level = MAX_LEVEL;
            this.levelFactor = Math.pow(2, this.level);
        }
        this.targetLevel = this.level;

        this.position = new BABYLON.Vector3(
            (this.iPos + 0.5) * CHUNCK_SIZE * this.levelFactor,
            (this.kPos + 0.5) * CHUNCK_SIZE * this.levelFactor,
            (this.jPos + 0.5) * CHUNCK_SIZE * this.levelFactor,
        )
    }

    public register(): void {
        if (!this.registered) {
            this._registered = true;
            this.terrain.chunckManager.registerChunck(this);
        }        
    }

    public unregister(): void {
        if (this.registered) {
            this._registered = false;
            this.terrain.chunckManager.unregisterChunck(this);
        }   
    }

    public redrawMesh(): void {
        if (this.kPos === 0) {
            this.disposeMesh();

            this.mesh = BABYLON.MeshBuilder.CreateGround("foo", { width: 1, height: 1 });
            this.mesh.position.copyFrom(this.position);
            this.mesh.position.y = 1 - this.level * 0.1;
            this.mesh.scaling.copyFromFloats(1, 1, 1).scaleInPlace(CHUNCK_LENGTH * this.levelFactor - 0.1);

            let mat = new BABYLON.StandardMaterial("mat");
            if (this.level % 6 === 0) {
                mat.diffuseColor.copyFromFloats(1, 0, 0);
            }
            else if (this.level % 6 === 1) {
                mat.diffuseColor.copyFromFloats(0, 1, 0);
            }
            else if (this.level % 6 === 2) {
                mat.diffuseColor.copyFromFloats(0, 0, 1);
            }
            else if (this.level % 6 === 3) {
                mat.diffuseColor.copyFromFloats(1, 1, 0);
            }
            else if (this.level % 6 === 4) {
                mat.diffuseColor.copyFromFloats(0, 1, 1);
            }
            else if (this.level % 6 === 5) {
                mat.diffuseColor.copyFromFloats(1, 0, 1);
            }

            this.mesh.material = mat;
        }
    }

    public disposeMesh(): void {
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = undefined;
        }
    }

    private _subdivided: boolean = false;
    public get subdivided(): boolean {
        return this._subdivided;
    }
    public subdivide(): void {
        this.unregister();
        if (this._subdivided) {
            return;
        }
        this._subdivided = true;
        for (let k = 0; k < 2; k++) {
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    let chunck = this.children[j + 2 * i + 4 * k];
                    if (!chunck) {
                        chunck = new Chunck(this.iPos * 2 + i, this.jPos * 2 + j, this.kPos * 2 + k, this);
                        this.children[j + 2 * i + 4 * k] = chunck;
                    }
                    chunck.redrawMesh();
                    chunck.register();
                }
            }
        }
        this.disposeMesh();
    }

    public canCollapse(): boolean {
        if (this.parent) {
            let siblings = this.parent.children;
            for (let i = 0; i < siblings.length; i++) {
                let sib = siblings[i];
                if (sib.targetLevel < this.targetLevel) {
                    return false;
                }
            }
            return true;
        }
    }

    public collapse(): void {
        if (this.canCollapse()) {
            this.parent.collapseChildren();
        }
    }

    public collapseChildren(): void {
        for (let i = 0; i < this.children.length; i++) {
            let child = this.children[i];
            child.unregister();
            child.disposeMesh();
            if (child.subdivided) {
                child.collapseChildren();
            }
        }
        this.children = [];
        this._subdivided = false;
        this.register();
        this.redrawMesh();
    }
}