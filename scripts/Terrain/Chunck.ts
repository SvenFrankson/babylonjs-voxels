var BLOCK_SIZE: number = 1;
var CHUNCK_LENGTH: number = 32;
var CHUNCK_LENGTH_2: number = CHUNCK_LENGTH * CHUNCK_LENGTH;
var CHUNCK_LENGTH_3: number = CHUNCK_LENGTH_2 * CHUNCK_LENGTH;
var CHUNCK_SIZE: number = BLOCK_SIZE * CHUNCK_LENGTH;

enum AdjacentAxis {
    IPrev = 0,
    INext = 1,
    JPrev = 2,
    JNext = 3,
    KPrev = 4,
    KNext = 5
}

class Chunck {

    public name: string;
    public terrain: Terrain;
    public genMaps: GenMap[];

    public position: BABYLON.Vector3;
    public level: number = 0;
    public targetLevel: number = 0;
    public levelFactor: number = 0;
    public adjacents: Chunck[] = [];
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

    public findAdjacents(): void {
        let iPrevChunck = this.terrain.getChunck(this.level, this.iPos - 1, this.jPos, this.kPos);
        if (iPrevChunck) {
            this.adjacents[AdjacentAxis.IPrev] = iPrevChunck;
            iPrevChunck.adjacents[AdjacentAxis.INext] = this;
        }
        let iNextChunck = this.terrain.getChunck(this.level, this.iPos + 1, this.jPos, this.kPos);
        if (iNextChunck) {
            this.adjacents[AdjacentAxis.INext] = iNextChunck;
            iNextChunck.adjacents[AdjacentAxis.IPrev] = this;
        }
        let jPrevChunck = this.terrain.getChunck(this.level, this.iPos, this.jPos - 1, this.kPos);
        if (jPrevChunck) {
            this.adjacents[AdjacentAxis.JPrev] = jPrevChunck;
            jPrevChunck.adjacents[AdjacentAxis.JNext] = this;
        }
        let jNextChunck = this.terrain.getChunck(this.level, this.iPos, this.jPos + 1, this.kPos);
        if (jNextChunck) {
            this.adjacents[AdjacentAxis.JNext] = jNextChunck;
            jNextChunck.adjacents[AdjacentAxis.JPrev] = this;
        }
        let kPrevChunck = this.terrain.getChunck(this.level, this.iPos, this.jPos, this.kPos - 1);
        if (kPrevChunck) {
            this.adjacents[AdjacentAxis.KPrev] = kPrevChunck;
            kPrevChunck.adjacents[AdjacentAxis.KNext] = this;
        }
        let kNextChunck = this.terrain.getChunck(this.level, this.iPos, this.jPos, this.kPos + 1);
        if (kNextChunck) {
            this.adjacents[AdjacentAxis.KNext] = kNextChunck;
            kNextChunck.adjacents[AdjacentAxis.KPrev] = this;
        }
    }

    public setAdjacent(other: Chunck): void {
        if (other.level === this.level) {
            if (other.iPos === this.iPos - 1) {
                this.adjacents[AdjacentAxis.IPrev] = other;
                other.adjacents[AdjacentAxis.INext] = this;
            }
            else if (other.iPos === this.iPos + 1) {
                this.adjacents[AdjacentAxis.INext] = other;
                other.adjacents[AdjacentAxis.IPrev] = this;
            }
            else if (other.jPos === this.jPos - 1) {
                this.adjacents[AdjacentAxis.JPrev] = other;
                other.adjacents[AdjacentAxis.JNext] = this;
            }
            else if (other.jPos === this.jPos + 1) {
                this.adjacents[AdjacentAxis.JNext] = other;
                other.adjacents[AdjacentAxis.JPrev] = this;
            }
            else if (other.kPos === this.kPos - 1) {
                this.adjacents[AdjacentAxis.KPrev] = other;
                other.adjacents[AdjacentAxis.KNext] = this;
            }
            else if (other.kPos === this.kPos + 1) {
                this.adjacents[AdjacentAxis.KNext] = other;
                other.adjacents[AdjacentAxis.KPrev] = this;
            }
        }
    }

    public removeFromAdjacents(): void {
        for (let index = 0; index < 6; index++) {
            let other = this.adjacents[index];
            if (other) {
                this.adjacents[index] = undefined;
                if (index % 2 === 0) {
                    other[index + 1] = undefined;
                }
                else {
                    other[index - 1] = undefined;
                }
            }
        }
    }

    public m: number = 2;
    public initializeData(): void {
        let m = this.m;
        let genMaps = [];
        for (let i = 0; i < 3; i++) {
            genMaps[i] = [];
            for (let j = 0; j < 3; j++) {
                genMaps[i][j] = this.terrain.getGenMap(0, this.level, this.iPos - 1 + i, this.jPos - 1 + j);
            }
        }
        if (!this.dataInitialized) {
            this.data = [];
            
            for (let i: number = - m; i <= CHUNCK_LENGTH + m; i++) {
                if (!this.data[i + m]) {
                    this.data[i + m] = [];
                }
                for (let j: number = - m; j <= CHUNCK_LENGTH + m; j++) {
                    if (!this.data[i + m][j + m]) {
                        this.data[i + m][j + m] = [];
                    }

                    let IMap = 1;
                    let JMap = 1;
                    let ii = i;
                    if (ii < 0) {
                        ii += CHUNCK_LENGTH;
                        IMap--;
                    }
                    if (ii > CHUNCK_LENGTH) {
                        ii -= CHUNCK_LENGTH;
                        IMap++;
                    }
                    let jj = j;
                    if (jj < 0) {
                        jj += CHUNCK_LENGTH;
                        JMap--;
                    }
                    if (jj > CHUNCK_LENGTH) {
                        jj -= CHUNCK_LENGTH;
                        JMap++;
                    }
                    let hGlobal = genMaps[IMap][JMap].data[ii][jj];

                    for (let k: number = - m; k <= CHUNCK_LENGTH + m; k++) {
                        let kGlobal = this.kPos * this.levelFactor * CHUNCK_SIZE + (k + 0.5) * this.levelFactor;
                        if (kGlobal < hGlobal) {
                            this.data[i + m][j + m][k + m] = BlockType.Dirt;
                        }
                        /*
                        else if (i > 1 && j > 1 && i < CHUNCK_LENGTH - 2 && j < CHUNCK_LENGTH - 2 && kGlobal < hGlobal + 5) {
                            if (Math.random() < 0.5) {
                                this.data[i + m][j + m][k + m] = BlockType.Dirt;
                            }
                            else {
                                this.data[i + m][j + m][k + m] = BlockType.None;
                            }
                        }
                        */
                        else {
                            this.data[i + m][j + m][k + m] = BlockType.None;
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
                    let block = this.data[i + this.m][j + this.m][k + this.m];
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
        if (this.level === level) {
            return this;
        }
        else {
            // Note : (this.levelFactor / 2) is wrong.
            let i = Math.floor((iPos - Math.pow(2, this.level - level) * this.iPos) / (Math.pow(2, this.level - level) / 2));
            let j = Math.floor((jPos - Math.pow(2, this.level - level) * this.jPos) / (Math.pow(2, this.level - level) / 2));
            let k = Math.floor((kPos - Math.pow(2, this.level - level) * this.kPos) / (Math.pow(2, this.level - level) / 2));
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

    public highlight(): void {
        if (this.mesh) {
            this.mesh.material = undefined;
        }
    }

    public unlit(): void {
        if (this.mesh) {
            this.mesh.material = this.terrain.material;
        }
    }

    public redrawMesh(): void {
        if (!this._dataInitialized) {
            this.initializeData();
        }
        if (this.level < 5) {
            this.disposeMesh();
            if (!this.isEmpty && !this.isFull) {

                this.mesh = new BABYLON.Mesh("foo");
                ChunckMeshBuilder.BuildMesh(this).applyToMesh(this.mesh);
                this.mesh.position.copyFromFloats(
                    (this.iPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize,
                    (this.kPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainHeight + 0.5 * this.levelFactor,
                    (this.jPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize
                );
                //this.mesh.position.y += Math.random();
                this.mesh.material = this.terrain.material;
                this.mesh.freezeWorldMatrix();
            }
        }
    }

    private _lastDrawnSides: number = 0b0;
    public redrawShellMesh(): void {
        if (this.level > 0 && this.level < 4) {
            if (!this.subdivided) {
                this.disposeShellMesh();
                return;
            }
            let sides = 0b0;
            for (let i = 0; i < 6; i++) {
                let adj = this.adjacents[i];
                if (adj && !adj.subdivided) {
                    sides |= 0b1 << i;
                }
            }
            
            if (this._lastDrawnSides != sides) {
                if (sides === 0b0) {
                    this.disposeShellMesh();
                }
                else {
                    this.doRedrawShellMesh(sides);
                }
                this._lastDrawnSides = sides;
            }
        }
    }

    public doRedrawShellMesh(sides: number): void {
        if (!this._dataInitialized) {
            this.initializeData();
        }
        this.disposeShellMesh();
        if (!this.isEmpty && !this.isFull) {

            let vData = ChunckMeshBuilder.BuildMeshShell(this, sides);
            if (vData.positions.length > 0) {
                this.shellMesh = new BABYLON.Mesh("foo");
                vData.applyToMesh(this.shellMesh);
                this.shellMesh.position.copyFromFloats(
                    (this.iPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize,
                    (this.kPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainHeight + 0.5 * this.levelFactor,
                    (this.jPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize
                );
                this.shellMesh.material = this.terrain.shellMaterial;
                this.shellMesh.freezeWorldMatrix();
            }
        }
    }

    public disposeAllMeshes(): void {
        this.disposeMesh();
        this.disposeShellMesh();
    }

    public disposeMesh(): void {
        if (this.mesh) {
            this.mesh.dispose();
        }
        this.mesh = undefined;
    }

    public disposeShellMesh(): void {
        if (this.shellMesh) {
            this.shellMesh.dispose();
        }
        this.shellMesh = undefined;
        this._lastDrawnSides = 0b0;
    }

    public subdivide(): Chunck[] {
        if (this.parent) {
            this.parent.disposeShellMesh();
            this.parent.unregister();
        }
        if (this._subdivided) {
            return;
        }
        this._subdivided = true;

        let kMax = 2;
        if ((this.kPos * 2 + 1) * this.levelFactor / 2 > this.terrain.chunckCountHeight) {
            kMax = 1;
        }

        for (let k = 0; k < kMax; k++) {
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    let chunck = this.children[j + 2 * i + 4 * k];
                    if (!chunck) {
                        chunck = new Chunck(this.iPos * 2 + i, this.jPos * 2 + j, this.kPos * 2 + k, this);
                        this.children[j + 2 * i + 4 * k] = chunck;
                    }
                    chunck.findAdjacents();
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
            child.removeFromAdjacents();
            if (child.subdivided) {
                child.collapseChildren();
            }
        }
        this.children = [];
        this._subdivided = false;
        this.findAdjacents();
        return this;
    }
}