class ChunckRedrawRequest {

    constructor(
        public chunck: Chunck,
        public callback?: () => void,
        public info: string = ""
    ) {

    }
}

interface IChunckManagerProperties {
    scene?: BABYLON.Scene,
    terrain: Terrain
}

class ChunckManager {
    
    private _viewpoint: BABYLON.Vector3;
    private _chunckIndex: number = 0;
    public chuncks: UniqueList<Chunck>;
    private _chunckLevelsSquareDistances: number[];
    public scene: BABYLON.Scene;
    public terrain: Terrain;

    constructor(
        prop: IChunckManagerProperties
    ) {
        this.scene = prop.scene;
        this.terrain = prop.terrain;

        this._viewpoint = BABYLON.Vector3.Zero();
        this.chuncks = new UniqueList<Chunck>();
        let distance = 100;
        let distances = [];
        for (let i = 0; i < this.terrain.maxLevel; i++) {
            distances.push(distance);
            distance = distance * 2;
        }
        this._chunckLevelsSquareDistances = distances.map(v => { return v * v; });
    }

    public initialize(): void {
        this.scene.onBeforeRenderObservable.add(this._update);
    }

    public dispose(): void {
        this.scene.onBeforeRenderObservable.removeCallback(this._update);
    }

    public registerChunck(chunck: Chunck): boolean {
        while (this.unregisterChunck(chunck)) {

        }

        this.chuncks.push(chunck);
        
        return true;
    }

    public unregisterChunck(chunck: Chunck): boolean {
        return this.chuncks.remove(chunck) != undefined;
    }

    private _getChunckLevel(sqrDistance: number): number {
        for (let i = 0; i < this._chunckLevelsSquareDistances.length - 1; i++) {
            if (sqrDistance < this._chunckLevelsSquareDistances[i]) {
                return i;
            }
        }
        return this._chunckLevelsSquareDistances.length - 1;
    }

    private _checkDuration: number = 15;
    private _update = () => {
        if (this.scene.activeCameras && this.scene.activeCameras.length > 0) {
            this._viewpoint.copyFrom(this.scene.activeCameras[0].globalPosition);
        }
        else {
            this._viewpoint.copyFrom(this.scene.activeCamera.globalPosition);
        }
        
        let t0 = performance.now();
        let t = t0;
        
        while ((t - t0) < this._checkDuration) {
            this._chunckIndex = (this._chunckIndex + 1) % this.chuncks.length;

            let chunck = this.chuncks.get(this._chunckIndex);
            let dir = this._viewpoint.subtract(chunck.position);
            let sqrDist = dir.lengthSquared();
            chunck.povSqrDist = sqrDist;
            chunck.setPovCornerFromDir(dir);
            chunck.targetLevel = this._getChunckLevel(sqrDist);
            if (chunck.level < chunck.targetLevel) {
                let parentChunck = chunck.collapse();
                if (parentChunck) {
                    let parentDir = this._viewpoint.subtract(parentChunck.position);
                    let parentSqrDist = parentDir.lengthSquared();
                    parentChunck.povSqrDist = parentSqrDist;
                    parentChunck.register();
                    parentChunck.setPovCornerFromDir(parentDir);
                    parentChunck.redrawMesh();
                    parentChunck.redrawShellMesh();
                }
            }
            else if (chunck.level > chunck.targetLevel) {
                let children = chunck.subdivide();
                if (children) {
                    children.forEach(childChunck => {
                        let childDir = this._viewpoint.subtract(childChunck.position);
                        let childSqrDist = childDir.lengthSquared();
                        childChunck.povSqrDist = childSqrDist;
                        childChunck.register();
                        childChunck.setPovCornerFromDir(childDir);
                        childChunck.redrawMesh();
                        childChunck.redrawShellMesh();
                    })
                }
            }
            else {
                chunck.redrawShellMesh();
            }

            t = performance.now();
        }
    }
}