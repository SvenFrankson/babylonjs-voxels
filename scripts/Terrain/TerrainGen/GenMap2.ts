interface IGenMapHarmonic {
    dist: number;
    amplitude: number;
}

var GEN_MAP_LENGTH: number = 1024;

class GenMap2 {

    public mapCount: number;
    public data: number[][][][];

    constructor(
        public terrain: Terrain
    ) {
        let terrainLength = this.terrain.chunckCount * CHUNCK_LENGTH;
        this.mapCount = terrainLength / GEN_MAP_LENGTH;
    }

    public getMap(iMap: number, jMap: number): number[][] {
        if (this.data[iMap]) {
            if (this.data[iMap][jMap]) {
                return this.data[iMap][jMap];
            }
        }
    }

    public setMap(iMap: number, jMap: number, data: number[][]): void {
        if (!this.data[iMap]) {
            this.data[iMap] = [];
        }
        if (!this.data[iMap][jMap]) {
            this.data[iMap][jMap] = [];
        }
        this.data[iMap][jMap] = data;
    }

    public createMap(iMap: number, jMap: number): number[][] {
        let data: number[][] = [];
        for (let i = 0; i <= GEN_MAP_LENGTH; i++) {
            data[i] = [];
            for (let j = 0; j <= GEN_MAP_LENGTH; j++) {
                data[i][j] = this.terrain.halfTerrainHeight;
                if (i > 0 && j > 0 && i < GEN_MAP_LENGTH && j < GEN_MAP_LENGTH) {
                    data[i][j] += Math.round(Math.random());
                }
            }
        }
        return data;
    }

    public getOrCreateMap(iMap: number, jMap: number): number[][] {
        let data = this.getMap(iMap, jMap);
        if (!data) {
            data = this.createMap(iMap, jMap);
            this.setMap(iMap, jMap, data);
        }
        return data;
    }
}