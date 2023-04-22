class Terrain {

    public chunckManager: ChunckManager;

    constructor(scene: BABYLON.Scene) {
        this.chunckManager = new ChunckManager(scene);
    }

    public initialize(): void {
        this.chunckManager.initialize();
    }

    public dispose(): void {
        this.chunckManager.dispose();
    }
}