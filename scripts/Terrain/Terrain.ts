interface ITerrainProperties {
    scene?: BABYLON.Scene,
    chunckCountHeight?: number,
    maxLevel?: number
}

class Terrain {

    public maxLevel: number = 10;
    public chunckCountHeight: number = 20;
    public chunckCount: number;
    public terrainHeight: number;
    public halfTerrainHeight: number;
    public terrainSize: number;
    public halfTerrainSize: number;

    public chunckManager: ChunckManager;
    public scene: BABYLON.Scene;

    constructor(prop: ITerrainProperties) {
        if (!prop.scene) {
            this.scene = BABYLON.Engine.Instances[0].scenes[0];
        }
        else {
            this.scene = prop.scene;
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

        this.chunckManager = new ChunckManager({
            scene: this.scene,
            terrain: this
        });
    }

    public initialize(): void {
        this.chunckManager.initialize();
    }

    public dispose(): void {
        this.chunckManager.dispose();
    }
}