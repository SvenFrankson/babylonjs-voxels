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
    private _chunckLevelsCubeDistances: number[];
    public scene: BABYLON.Scene;
    public terrain: Terrain;
    public pause: boolean = false;

    private _checkDuration: number = 15;
    public get checkDuration(): number {
        return this._checkDuration;
    }

    constructor(
        prop: IChunckManagerProperties
    ) {
        this.scene = prop.scene;
        this.terrain = prop.terrain;

        this._viewpoint = BABYLON.Vector3.Zero();
        this.chuncks = new UniqueList<Chunck>();
        let distance = 120;
        let distances = [0];
        this._chunckLevelsCubeDistances = [];
        for (let i = 0; i < this.terrain.maxLevel; i++) {
            distances.push(distance);
            this._chunckLevelsCubeDistances.push(distance);
            distance = distance * 2;
        }
        this._chunckLevelsSquareDistances = distances.map(v => { return v * v; });
        this._chunckLevelsSquareDistances.push(Infinity);
    }

    public initialize(): void {
        this.scene.onBeforeRenderObservable.add(this._update);
    }

    public dispose(): void {
        this.scene.onBeforeRenderObservable.removeCallback(this._update);
    }

    public registerChunck(chunck: Chunck): boolean {
        this.chuncks.push(chunck);
        
        return true;
    }

    public unregisterChunck(chunck: Chunck): boolean {
        return this.chuncks.remove(chunck) != undefined;
    }

    private _getChunckLevel(currentLevel: number, sqrDistance: number): number {
        let distSub = this._chunckLevelsSquareDistances[currentLevel];
        if (sqrDistance < distSub) {
            return currentLevel - 1;
        }
        let distCollapse = this._chunckLevelsSquareDistances[currentLevel + 2];
        if (sqrDistance > distCollapse) {
            return currentLevel + 1;
        }
        return currentLevel;
    }

    private _getChunckLevelCube(sqrDistance: number): number {
        for (let i = 0; i < this._chunckLevelsCubeDistances.length - 1; i++) {
            if (sqrDistance < this._chunckLevelsCubeDistances[i]) {
                return i;
            }
        }
        return this._chunckLevelsCubeDistances.length - 1;
    }

    private _update = () => {
        if (this.pause) {
            return;
        }
        if (this.scene.activeCameras && this.scene.activeCameras.length > 0) {
            this._viewpoint.copyFrom(this.scene.activeCameras[0].globalPosition);
        }
        else {
            this._viewpoint.copyFrom(this.scene.activeCamera.globalPosition);
        }
        
        let t0 = performance.now();
        let t = t0;
        
        let count = 0;
        while ((t - t0) < this._checkDuration) {
            this._chunckIndex = (this._chunckIndex + 1) % this.chuncks.length;

            let chunck = this.chuncks.get(this._chunckIndex);
            let dir = this._viewpoint.subtract(chunck.barycenter);
            let dist = Math.max(
                Math.abs(dir.x),
                Math.abs(dir.y),
                Math.abs(dir.z)
            )
            let srqDistance = dir.lengthSquared();

            //chunck.targetLevel = this._getChunckLevelCube(dist);
            chunck.targetLevel = this._getChunckLevel(chunck.level, srqDistance);
            if (chunck.level < chunck.targetLevel) {
                let parentChunck = chunck.collapse();
                if (parentChunck) {
                    count++;
                    parentChunck.redrawMesh();
                    parentChunck.adjacents.forEach(adj => {
                        adj.redrawMesh();
                    })
                }
            }
            else if (chunck.level > chunck.targetLevel) {
                let children = chunck.subdivide();
                if (children) {
                    count++;
                    children.forEach(childChunck => {
                        childChunck.redrawMesh();
                    })
                    chunck.adjacents.forEach(adj => {
                        adj.redrawMesh();
                    })
                }
            }

            t = performance.now();
        }

        let newDuration = count / 5 * 15;
        newDuration = Math.min(Math.max(0.1, newDuration), 15);
        this._checkDuration = this._checkDuration * 0.9 + newDuration * 0.1;
    }
}