var BLOCK_SIZE: number = 1;
var CHUNCK_LENGTH: number = 16;
var CHUNCK_SIZE: number = BLOCK_SIZE * CHUNCK_LENGTH;

class Chunck {

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
            this.level = this.terrain.maxLevel;
            this.levelFactor = Math.pow(2, this.level);
        }
        this.targetLevel = this.level;

        this.position = new BABYLON.Vector3(
            (this.iPos + 0.5) * CHUNCK_SIZE * this.levelFactor - this.terrain.halfTerrainSize,
            (this.kPos + 0.5) * CHUNCK_SIZE * this.levelFactor - this.terrain.halfTerrainHeight,
            (this.jPos + 0.5) * CHUNCK_SIZE * this.levelFactor - this.terrain.halfTerrainSize,
        )
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
        if (!this._dataInitialized) {
            this.initializeData();
        }
        if (this.level < 3) {
            this.disposeMesh();
            if (!this.isEmpty && !this.isFull) {
                //this.mesh = BABYLON.MeshBuilder.CreateGround("foo", { width: 1, height: 1 });
                this.mesh = new BABYLON.Mesh("foo");
                ChunckMeshBuilder.BuildMesh(this).applyToMesh(this.mesh);
                this.mesh.position.copyFromFloats(
                    (this.iPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize,
                    this.kPos * CHUNCK_SIZE * this.levelFactor - this.terrain.halfTerrainHeight,
                    (this.jPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize
                );
                this.mesh.freezeWorldMatrix();
                /*
                if (this.level === 0) {
                    if (this.iPos === this.terrain.chunckCount / 2) {
                        if (this.jPos === this.terrain.chunckCount / 2) {
                            if (this.kPos === this.terrain.chunckCountHeight / 2) {
                                let mat = new BABYLON.StandardMaterial("debug");
                                mat.specularColor.copyFromFloats(0, 0, 0);
                                mat.diffuseColor.copyFromFloats(0, 1, 1);
                                mat.alpha = 0.2;
                                for (let i = 0; i < CHUNCK_LENGTH; i++) {
                                    for (let j = 0; j < CHUNCK_LENGTH; j++) {
                                        for (let k = 0; k < CHUNCK_LENGTH; k++) {
                                            if (this.data[i][j][k]) {
                                                let debugBlock = BABYLON.MeshBuilder.CreateBox("debug-block", { size: 1.05 });
                                                debugBlock.position.copyFromFloats(0.5 + i, 0.5 + k, 0.5 + j);
                                                debugBlock.material = mat;
                                                debugBlock.parent = this.mesh;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                */
            }

            /*
            if (this.mesh) {
                let mat = new BABYLON.StandardMaterial("mat");
                mat.specularColor.copyFromFloats(0, 0, 0);
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
            */
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