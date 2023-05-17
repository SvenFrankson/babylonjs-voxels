interface ITerrainProperties {
    randSeed?: RandSeed,
    scene?: BABYLON.Scene,
    chunckCountHeight?: number,
    maxLevel?: number
}

class Terrain {

    public randSeed: RandSeed;
    public maxLevel: number = 10;
    public chunckCountHeight: number = 20;
    public chunckCount: number;
    public terrainHeight: number;
    public terrainHeight_m: number;
    public halfTerrainHeight: number;
    public halfTerrainHeight_m: number;
    public terrainSize_m: number;
    public halfTerrainSize_m: number;

    public root: Chunck;
    public chunckManager: ChunckManager;
    public scene: BABYLON.Scene;

    private materials: TerrainMaterial[];
    public highlightMaterial: BABYLON.StandardMaterial;
    public testMaterials: TerrainMaterial[];

    constructor(prop: ITerrainProperties) {
        if (!prop.scene) {
            this.scene = BABYLON.Engine.Instances[0].scenes[0];
        }
        else {
            this.scene = prop.scene;
        }
        if (!prop.randSeed) {
            this.randSeed = new RandSeed("undefined");
        }
        else {
            this.randSeed = prop.randSeed;
        }
        if (isFinite(prop.maxLevel)) {
            this.maxLevel = prop.maxLevel;
        }
        if (isFinite(prop.chunckCountHeight)) {
            this.chunckCountHeight = prop.chunckCountHeight;
        }


        this.terrainHeight = this.chunckCountHeight * CHUNCK_LENGTH;
        this.halfTerrainHeight = this.terrainHeight * 0.5;
        this.terrainHeight_m = this.terrainHeight * BLOCK_SIZE_M;
        this.halfTerrainHeight_m = this.halfTerrainHeight * BLOCK_SIZE_M;
        this.chunckCount = VMath.Pow2(prop.maxLevel);
        this.terrainSize_m = this.chunckCount * CHUNCK_SIZE_M;
        this.halfTerrainSize_m = this.terrainSize_m * 0.5;

        console.log("this.terrainHeight " + this.terrainHeight);
        console.log("this.chunckCount " + this.chunckCount);
        console.log("this.terrainSize " + this.terrainSize_m);
        let kmSize = this.terrainSize_m / 1000;
        let surface = kmSize * kmSize;
        console.log("surface " + surface + " km²");
        let terrainLength = this.chunckCount * CHUNCK_LENGTH;
        console.log("terrainLength " + terrainLength);

        this.materials = [
            new TerrainMaterial("terrain-material-lod0", this.scene),
            new TerrainMaterial("terrain-material-lod1", this.scene),
            new TerrainMaterial("terrain-material-lod2", this.scene)
        ];
        this.materials[0].setLevel(0);
        this.materials[1].setLevel(1);
        this.materials[2].setLevel(2);
        this.highlightMaterial = new BABYLON.StandardMaterial("hightlight-material");
        this.highlightMaterial.diffuseColor.copyFromFloats(1, 0, 0);
        this.highlightMaterial.specularColor.copyFromFloats(0, 0, 0);
        this.testMaterials = [];
        for (let i = 0; i < 6; i++) {
            this.testMaterials[i] = new TerrainMaterial("terrain-shell-material", this.scene);
        }

        this.chunckManager = new ChunckManager({
            scene: this.scene,
            terrain: this
        });

        this.root = new Chunck(0, 0, 0, this);
    }

    public initialize(): void {
        this.chunckManager.initialize();
    }

    public dispose(): void {
        this.chunckManager.dispose();
    }

    public getMaterial(lod: number): TerrainMaterial {
        return this.materials[Math.min(lod, this.materials.length - 1)];
    }

    public getChunck(level: number, iPos: number, jPos: number, kPos: number): Chunck {
        return this.root.getChunck(level, iPos, jPos, kPos);
    }

    public getGenMap(index: number, level: number, iPos: number, jPos: number): GenMap {
        return this.root.genMaps[index].getGenMap(level, iPos, jPos);
    }

    public getChunckAtPos(pos: BABYLON.Vector3, level: number): Chunck {
        let iPos = Math.floor((pos.x + this.halfTerrainSize_m) / CHUNCK_SIZE_M);
        let jPos = Math.floor((pos.z + this.halfTerrainSize_m) / CHUNCK_SIZE_M);
        let kPos = Math.floor((pos.y + this.halfTerrainHeight_m) / CHUNCK_SIZE_M);
        return this.getChunck(level, iPos, jPos, kPos);
    }

    public getChunckAndIJKAtPos(pos: BABYLON.Vector3, level: number): { chunck: Chunck, ijk: { i: number, j: number, k: number } } {
        let chunck = this.getChunckAtPos(pos, level);
        if (chunck) {
            return {
                chunck: chunck,
                ijk: chunck.getIJKAtPos(pos)
            }
        }
    }
}