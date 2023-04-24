class ChunckRedrawRequest {

    constructor(
        public chunck: Chunck,
        public callback?: () => void,
        public info: string = ""
    ) {

    }
}

class ChunckManager {
    
    private _viewpoint: BABYLON.Vector3;
    private _chunckIndex: number = 0;
    public chuncks: UniqueList<Chunck>;
    private _chunckLevelsSquareDistances: number[];

    constructor(
        public scene: BABYLON.Scene
    ) {
        this._viewpoint = BABYLON.Vector3.Zero();
        this.chuncks = new UniqueList<Chunck>();
        let distance = 80;
        let distances = [];
        for (let i = 0; i < MAX_LEVEL; i++) {
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
            let sqrDist = BABYLON.Vector3.DistanceSquared(chunck.position, this._viewpoint);
            chunck.targetLevel = this._getChunckLevel(sqrDist);
            if (chunck.level < chunck.targetLevel) {
                chunck.collapse();
            }
            if (chunck.level > chunck.targetLevel) {
                chunck.subdivide();
            }

            t = performance.now();
        }
    }
}