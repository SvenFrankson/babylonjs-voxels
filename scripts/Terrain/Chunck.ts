var BLOCK_SIZE: number = 1;
var CHUNCK_LENGTH: number = 16;
var CHUNCK_LENGTH_2: number = CHUNCK_LENGTH * CHUNCK_LENGTH;
var CHUNCK_LENGTH_3: number = CHUNCK_LENGTH_2 * CHUNCK_LENGTH;
var CHUNCK_SIZE: number = BLOCK_SIZE * CHUNCK_LENGTH;

class Chunck {

    public name: string;
    public terrain: Terrain;
    public genMap: GenMap;

    public position: BABYLON.Vector3;
    public level: number = 0;
    public targetLevel: number = 0;
    public levelFactor: number = 0;
    public children: Chunck[] = [];
    public parent: Chunck;

    private _isEmpty: boolean = true;
    public get isEmpty(): boolean {
        return this._isEmpty;
    }
    private _isFull: boolean = false;
    public get isFull(): boolean {
        return this._isFull;
    }
    private _dataInitialized: boolean = false;
    public get dataInitialized(): boolean {
        return this._dataInitialized;
    }
    public data: number[][][];

    public mesh: BABYLON.Mesh;
    public shellMesh: BABYLON.Mesh;
    public barycenterMesh: BABYLON.Mesh;

    private _registered: boolean = false;
    public get registered(): boolean {
        return this._registered;
    }

    private _subdivided: boolean = false;
    public get subdivided(): boolean {
        return this._subdivided;
    }

    public povCorner: number;
    public povDir: BABYLON.Vector3;
    public povSqrDist: number;

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
            this.level = this.terrain.maxLevel;
            this.levelFactor = Math.pow(2, this.level);
        }
        this.targetLevel = this.level;
        
        this.name = "chunck:" + this.level + ":" + this.iPos + "-" + this.jPos	+ "-" + this.kPos;

        this.position = new BABYLON.Vector3(
            ((this.iPos + 0.5) * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize,
            ((this.kPos + 0.5) * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainHeight,
            ((this.jPos + 0.5) * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize
        );
        this.povDir = BABYLON.Vector3.One();
    }

    public initializeData(): void {
        if (!this.dataInitialized) {
            this.data = [];
            
            for (let i: number = 0; i <= CHUNCK_LENGTH; i++) {
                if (!this.data[i]) {
                    this.data[i] = [];
                }
                for (let j: number = 0; j <= CHUNCK_LENGTH; j++) {
                    if (!this.data[i][j]) {
                        this.data[i][j] = [];
                    }
                    let hGlobal = this.genMap.data[i][j];
                    for (let k: number = 0; k <= CHUNCK_LENGTH; k++) {
                        let kGlobal = this.kPos * this.levelFactor * CHUNCK_SIZE + k * this.levelFactor;
                        if (kGlobal < hGlobal) {
                            this.data[i][j][k] = BlockType.Dirt;
                        }
                        else {
                            this.data[i][j][k] = BlockType.None;
                        }
                    }
                }
            }

            /*
            let modData = window.localStorage.getItem(this.getUniqueName());
            if (modData) {
                this.modDataOctree = OctreeNode.DeserializeFromString(modData);
                if (this.modDataOctree) {
                    this.modDataOctree.forEach((v, i, j, k) => {
                        this.data[i][j][k] = v;
                    });
                }
            }
            */

            this._dataInitialized = true;
            this.updateIsEmptyIsFull();
        }
    }

    public updateIsEmptyIsFull(): void {
        this._isEmpty = true;
        this._isFull = true;
        for (let i = 0; i <= CHUNCK_LENGTH; i++) {
            for (let j = 0; j <= CHUNCK_LENGTH; j++) {
                for (let k = 0; k <= CHUNCK_LENGTH; k++) {
                    let block = this.data[i][j][k];
                    this._isFull = this._isFull && (block > BlockType.Water);
                    this._isEmpty = this._isEmpty && (block < BlockType.Water);
                    if (!this._isFull && !this._isEmpty) {
                        return;
                    }
                }
            }
        }
    }

    public getChunck(level: number, iPos: number, jPos: number, kPos: number): Chunck {
        if (this.level - level === 1) {
            let i = Math.floor((iPos - 2 * this.iPos));
            let j = Math.floor((jPos - 2 * this.jPos));
            let k = Math.floor((kPos - 2 * this.kPos));
            let child = this.children[j + 2 * i + 4 * k];
            if (child instanceof Chunck) {
                return child;
            }
        }
        else {
            let i = Math.floor((iPos - this.levelFactor * this.iPos) / (this.levelFactor / 2));
            let j = Math.floor((jPos - this.levelFactor * this.jPos) / (this.levelFactor / 2));
            let k = Math.floor((kPos - this.levelFactor * this.kPos) / (this.levelFactor / 2));
            let child = this.children[j + 2 * i + 4 * k];
            if (child instanceof Chunck) {
                return child.getChunck(level, iPos, jPos, kPos);
            }
        }
        return undefined;
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
    

    public setPovCornerFromDir(dir: BABYLON.Vector3): void {
        this.povDir.copyFrom(dir);
        return;
        this.povCorner = 0;
        if (dir.y > 0) {
            this.povCorner += 4;
        }
        if (dir.z > 0) {
            this.povCorner += 2;
        }
        if (dir.x > 0) {
            this.povCorner += 1;
        }
    }

    public redrawMesh(): void {
        if (!this._dataInitialized) {
            this.initializeData();
        }
        if (this.level < 4) {
            this.disposeMesh();
            if (!this.isEmpty && !this.isFull) {
                this.mesh = new BABYLON.Mesh("foo");
                ChunckMeshBuilder.BuildMesh(this).applyToMesh(this.mesh);
                this.mesh.position.copyFromFloats(
                    (this.iPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize,
                    (this.kPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainHeight,
                    (this.jPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize
                );
                this.mesh.material = this.terrain.material;

                if (this.level > 0) {
                    this.shellMesh = new BABYLON.Mesh("foo");
                    ChunckMeshBuilder.BuildMeshShell(this).applyToMesh(this.shellMesh);
                    this.shellMesh.parent = this.mesh;
                    this.shellMesh.material = this.mesh.material;
                }
                this.mesh.freezeWorldMatrix();
            }
        }
    }

    public disposeMesh(): void {
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = undefined;
        }
        if (this.shellMesh) {
            this.shellMesh.dispose();
            this.shellMesh = undefined;
        }
        if (this.barycenterMesh) {
            this.barycenterMesh.dispose();
            this.barycenterMesh = undefined;
        }
    }

    public subdivide(): Chunck[] {
        this.unregister();
        if (this._subdivided) {
            return;
        }
        this._subdivided = true;

        let kMax = 2;
        if ((this.kPos * 2 + 1) * this.levelFactor / 2 > this.terrain.chunckCountHeight) {
            kMax = 1;
        }

        let genMaps = this.genMap.subdivide();
        for (let k = 0; k < kMax; k++) {
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    let chunck = this.children[j + 2 * i + 4 * k];
                    if (!chunck) {
                        chunck = new Chunck(this.iPos * 2 + i, this.jPos * 2 + j, this.kPos * 2 + k, this);
                        chunck.genMap = genMaps[i][j];
                        this.children[j + 2 * i + 4 * k] = chunck;
                    }
                }
            }
        }
        this.disposeMesh();
        return this.children;
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

    public collapse(): Chunck {
        if (this.canCollapse()) {
            return this.parent.collapseChildren();
        }
    }

    public collapseChildren(): Chunck {
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
        return this;
    }
}