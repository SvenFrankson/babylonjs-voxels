var BLOCK_SIZE: number = 1;
var CHUNCK_LENGTH: number = 16;
var CHUNCK_LENGTH_2: number = CHUNCK_LENGTH * CHUNCK_LENGTH;
var CHUNCK_LENGTH_3: number = CHUNCK_LENGTH_2 * CHUNCK_LENGTH;
var CHUNCK_SIZE: number = BLOCK_SIZE * CHUNCK_LENGTH;
var DRAW_CHUNCK_MARGIN: number = 2;

enum AdjacentAxis {
    IPrev = 0,
    INext = 1,
    JPrev = 2,
    JNext = 3,
    KPrev = 4,
    KNext = 5
}

class Chunck {

    public static MAX_DISPLAYED_LEVEL: number = 3;
    public name: string;
    public terrain: Terrain;
    public genMaps: GenMap[];

    public position: BABYLON.Vector3;
    public barycenter: BABYLON.Vector3;
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
    private _filledSide: number = 0b0;
    public get filledSide(): number {
        return this._filledSide;
    }
    private _dataInitialized: boolean = false;
    public get dataInitialized(): boolean {
        return this._dataInitialized;
    }
    private _dataSize: number;
    private _dataSizeSquare: number;
    private _data: Uint8Array;
    public getData(i: number, j: number, k: number): number {
        return this._data[i + j * this._dataSize + k * this._dataSizeSquare];
    }
    public setData(v: number, i: number, j: number, k: number): number {
        return this._data[i + j * this._dataSize + k * this._dataSizeSquare] = v;
    }

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
            this.levelFactor = VMath.Pow2(this.level);
        }
        this.targetLevel = this.level;

        this.name = "chunck:" + this.level + ":" + this.iPos + "-" + this.jPos + "-" + this.kPos;

        this.position = new BABYLON.Vector3(
            (this.iPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize,
            (this.kPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainHeight + 0.5 * this.levelFactor,
            (this.jPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize
        );
        this.barycenter = new BABYLON.Vector3(
            ((this.iPos + 0.5) * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize,
            ((this.kPos + 0.5) * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainHeight + 0.5 * this.levelFactor,
            ((this.jPos + 0.5) * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize
        );
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

    public static _TmpGenMaps0: GenMap[][] = [[], [], []];
    public static _TmpGenMaps1: GenMap[][] = [[], [], []];
    public static _TmpGenMaps2: GenMap[][] = [[], [], []];
    public static _TmpGenMaps3: GenMap[][] = [[], [], []];
    public initializeData(): void {
        //this.initializeData2();
        //return;
        let m = DRAW_CHUNCK_MARGIN;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                Chunck._TmpGenMaps0[i][j] = this.terrain.getGenMap(0, this.level, this.iPos - 1 + i, this.jPos - 1 + j);
                Chunck._TmpGenMaps1[i][j] = this.terrain.getGenMap(1, this.level, this.iPos - 1 + i, this.jPos - 1 + j);
                Chunck._TmpGenMaps2[i][j] = this.terrain.getGenMap(2, this.level, this.iPos - 1 + i, this.jPos - 1 + j);
                Chunck._TmpGenMaps3[i][j] = this.terrain.getGenMap(3, this.level, this.iPos - 1 + i, this.jPos - 1 + j);
            }
        }
        if (!this.dataInitialized) {
            this._dataSize = 2 * m + CHUNCK_LENGTH + 1;
            this._dataSizeSquare = this._dataSize * this._dataSize;
            this._data = new Uint8Array(this._dataSizeSquare * this._dataSize);

            for (let i: number = - m; i <= CHUNCK_LENGTH + m; i++) {
                for (let j: number = - m; j <= CHUNCK_LENGTH + m; j++) {
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
                    let hGlobal = Chunck._TmpGenMaps0[IMap][JMap].getData(ii, jj);
                    let holeHeight = Chunck._TmpGenMaps1[IMap][JMap].getData(ii, jj);
                    let hAltitudeHole = Chunck._TmpGenMaps2[IMap][JMap].getData(ii, jj);
                    let hColor = Chunck._TmpGenMaps3[IMap][JMap].getData(ii, jj);

                    for (let k: number = - m; k <= CHUNCK_LENGTH + m; k++) {
                        let kGlobal = this.kPos * this.levelFactor * CHUNCK_SIZE + (k + 0.5) * this.levelFactor;
                        
                        this.setData(BlockType.None, i + m, j + m, k + m);
                        if (Math.abs(kGlobal - hAltitudeHole) < holeHeight) {
                            this.setData(BlockType.None, i + m, j + m, k + m);
                        }
                        else if (kGlobal < hGlobal) {
                            if (hColor > this.terrain.halfTerrainHeight) {
                                this.setData(BlockType.Grass, i + m, j + m, k + m);
                            }
                            else {
                                this.setData(BlockType.Dirt, i + m, j + m, k + m);
                            }
                            /*
                            if (Math.abs(kGlobal - hGlobalHole) < 5) {
                                this.setData(BlockType.None, i + m, j + m, k + m);
                            }
                            else {
                                this.setData(BlockType.Dirt, i + m, j + m, k + m);
                            }
                            */
                        }
                        else {
                            this.setData(BlockType.None, i + m, j + m, k + m);
                            /*
                            if (Math.abs(kGlobal - hGlobalHole) < 2) {
                                this.setData(BlockType.Dirt, i + m, j + m, k + m);
                            }
                            else {
                                this.setData(BlockType.None, i + m, j + m, k + m);
                            }*/
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

    public initializeData2(): void {
        let m = DRAW_CHUNCK_MARGIN;

        if (!this.dataInitialized) {
            this._dataSize = 2 * m + CHUNCK_LENGTH + 1;
            this._data = new Uint8Array(this._dataSizeSquare * this._dataSize);

            for (let i: number = - m; i <= CHUNCK_LENGTH + m; i++) {
                for (let j: number = - m; j <= CHUNCK_LENGTH + m; j++) {
                    for (let k: number = - m; k <= CHUNCK_LENGTH + m; k++) {
                        let kGlobal = this.kPos * this.levelFactor * CHUNCK_SIZE + (k + 0.5) * this.levelFactor;
                        if (kGlobal < this.terrain.halfTerrainHeight) {
                            this.setData(BlockType.Dirt, i + m, j + m, k + m);
                        }
                        else {
                            this.setData(BlockType.None, i + m, j + m, k + m);
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
        let m = DRAW_CHUNCK_MARGIN;
        this._isEmpty = true;
        this._isFull = true;

        for (let i = 0; i <= CHUNCK_LENGTH; i++) {
            for (let j = 0; j <= CHUNCK_LENGTH; j++) {
                for (let k = 0; k <= CHUNCK_LENGTH; k++) {
                    let block = this.getData(i + m, j + m, k + m);
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
            let f = VMath.Pow2(this.level - level);
            let i = Math.floor((iPos - f * this.iPos) / (f / 2));
            let j = Math.floor((jPos - f * this.jPos) / (f / 2));
            let k = Math.floor((kPos - f * this.kPos) / (f / 2));
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

    public highlight(): void {
        if (this.mesh) {
            this.mesh.material = undefined;
        }
    }

    public unlit(): void {
        if (this.mesh) {
            this.mesh.material = this.terrain.getMaterial(this.level);
        }
    }

    public redrawMesh(): void {
        if (!this.subdivided) {
            if (this.level <= Chunck.MAX_DISPLAYED_LEVEL) {
                if (!this._dataInitialized) {
                    this.initializeData();
                }
                if (!this.isEmpty && !this.isFull) {
    
                    let sides = 0b0;
                    for (let i = 0; i < 6; i++) {
                        let adj = this.adjacents[i];
                        if (adj && adj.level === this.level && adj.subdivided && !adj.isFull) {
                            sides |= 0b1 << i;
                        }
                    }
    
                    if (!this.mesh || sides != this._lastDrawnSides) {
                        let vertexData = ChunckMeshBuilder.BuildMesh(this, sides);
                        if (vertexData) {
                            if (!this.mesh) {
                                this.mesh = new BABYLON.Mesh("foo");
                            }
                            vertexData.applyToMesh(this.mesh);
                            this.mesh.position.copyFromFloats(
                                (this.iPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize,
                                (this.kPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainHeight + 0.5 * this.levelFactor,
                                (this.jPos * CHUNCK_SIZE) * this.levelFactor - this.terrain.halfTerrainSize
                            );
                            this.mesh.material = this.terrain.getMaterial(this.level);
                            //this.mesh.material = this.terrain.testMaterials[this.level];
                            this.mesh.freezeWorldMatrix();
                        }
                        this._lastDrawnSides = sides;
                    }
                }
            }
        }
    }

    private _lastDrawnSides: number = 0b0;

    public disposeMesh(): void {
        if (this.mesh) {
            this.mesh.dispose();
        }
        this.mesh = undefined;
    }

    public subdivide(): Chunck[] {
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
                    chunck.register();
                    chunck.findAdjacents();
                }
            }
        }
        this.unregister();
        this.disposeMesh();
        return this.children;
    }

    public canCollapse(): boolean {
        if (this.parent) {
            if (!this.parent.subdivided) {
                console.error("oupsy " + this.children.length);
            }
            let siblings = this.parent.children;
            for (let i = 0; i < siblings.length; i++) {
                let sib = siblings[i];
                if (sib.subdivided) {
                    return false;
                }
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
        }
        this.register();
        this.children = [];
        this._subdivided = false;
        this.findAdjacents();
        return this;
    }
}