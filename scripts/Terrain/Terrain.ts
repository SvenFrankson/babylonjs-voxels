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
    public halfTerrainHeight: number;
    public terrainSize: number;
    public halfTerrainSize: number;

    public root: Chunck;
    public chunckManager: ChunckManager;
    public scene: BABYLON.Scene;

    public material: BABYLON.StandardMaterial;

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


        this.terrainHeight = this.chunckCountHeight * CHUNCK_SIZE;
        this.halfTerrainHeight = this.terrainHeight * 0.5;
        this.chunckCount = Math.pow(2, prop.maxLevel);
        this.terrainSize = this.chunckCount * CHUNCK_SIZE;
        this.halfTerrainSize = this.terrainSize * 0.5;

        console.log("this.terrainHeight " + this.terrainHeight);
        console.log("this.chunckCount " + this.chunckCount);
        console.log("this.terrainSize " + this.terrainSize);
        let kmSize = this.terrainSize / 1000;
        let surface = kmSize * kmSize;
        console.log("surface " + surface);

        this.material = new BABYLON.StandardMaterial("debug");
        this.material.specularColor.copyFromFloats(0, 0, 0);
        this.material.diffuseColor = BABYLON.Color3.FromHexString("#33eb39");

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

    public getChunck(level: number, iPos: number, jPos: number, kPos: number): Chunck {
        return this.root.getChunck(level, iPos, jPos, kPos);
    }

    public getGenMap(index: number, level: number, iPos: number, jPos: number): GenMap {
        return this.root.genMaps[index].getGenMap(level, iPos, jPos);
    }

    public getChunckAtPos(pos: BABYLON.Vector3, level: number): Chunck {
        let iPos = Math.floor((pos.x + this.halfTerrainSize) / CHUNCK_SIZE);
        let jPos = Math.floor((pos.z + this.halfTerrainSize) / CHUNCK_SIZE);
        let kPos = Math.floor((pos.y + this.halfTerrainHeight) / CHUNCK_SIZE);
        return this.getChunck(level, iPos, jPos, kPos);
    }
}