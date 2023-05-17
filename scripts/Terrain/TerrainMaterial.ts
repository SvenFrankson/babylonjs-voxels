class TerrainMaterial extends BABYLON.ShaderMaterial {

    private _lightInvDirW: BABYLON.Vector3 = BABYLON.Vector3.Up();
    private _level: number = 0;

    constructor(name: string, scene: BABYLON.Scene) {
        super(
            name,
            scene,
            {
                vertex: "terrainToon",
                fragment: "terrainToon",
            },
            {
                attributes: ["position", "normal", "uv", "uv2", "color"],
                uniforms: [
                    "world", "worldView", "worldViewProjection", "view", "projection",
                    "lightInvDirW",
                    "level"
                ]
            }
        );        

        this.setLightInvDir(BABYLON.Vector3.One().normalize());
        this.setLevel(0);

        this.setFloat("blockSize_m", BLOCK_SIZE_M);
    }

    public getLightInvDir(): BABYLON.Vector3 {
        return this._lightInvDirW;
    }

    public setLightInvDir(p: BABYLON.Vector3): void {
        this._lightInvDirW.copyFrom(p);
        this.setVector3("lightInvDirW", this._lightInvDirW);
    }

    public getLevel(): number {
        return this._level;
    }

    public setLevel(v: number): void {
        this._level = v;
        this.setInt("level", this._level);
    }
}