interface IGenMapHarmonic {
    dist: number;
    amplitude: number;
}

class GenMap {

    public data: number[][];
    public children: GenMap[][];

    private _subdivided: boolean = false;
    public get subdivided(): boolean {
        return this._subdivided;
    }

    constructor(
        public level: number,
        public iPos: number,
        public jPos: number,
        public terrain: Terrain
    ) {
        this.data = [];
        for (let i = 0; i <= CHUNCK_LENGTH; i++) {
            this.data[i] = [];
            for (let j = 0; j <= CHUNCK_LENGTH; j++) {
                this.data[i][j] = this.terrain.halfTerrainHeight;
            }
        }
    }

    public addData(): void {
        if (this.level <= 9) {
            /*
            let p0 = RAND.getValue4D(this.terrain.randSeed, this.iPos, this.jPos, 0, this.level);
            let p1 = RAND.getValue4D(this.terrain.randSeed, this.iPos + 1, this.jPos, 0, this.level);
            let p2 = RAND.getValue4D(this.terrain.randSeed, this.iPos + 1, this.jPos + 1, 0, this.level);
            let p3 = RAND.getValue4D(this.terrain.randSeed, this.iPos, this.jPos + 1, 0, this.level);

            p0 = ((p0 - 0.5) * 2) * 2 * Math.pow(2, this.level);
            p1 = ((p1 - 0.5) * 2) * 2 * Math.pow(2, this.level);
            p2 = ((p2 - 0.5) * 2) * 2 * Math.pow(2, this.level);
            p3 = ((p3 - 0.5) * 2) * 2 * Math.pow(2, this.level);

            for (let i = 0; i <= CHUNCK_LENGTH; i++) {
                for (let j = 0; j <= CHUNCK_LENGTH; j++) {
                    let di = i / CHUNCK_LENGTH;
                    let dj = j / CHUNCK_LENGTH;
                    let p01 = p0 * (1 - di) + p1 * di;
                    let p32 = p3 * (1 - di) + p2 * di;
                    let p = p01 * (1 - dj) + p32 * dj;
                    this.data[i][j] += p;
                }
            }
            */
           
            for (let i = 0; i <= CHUNCK_LENGTH; i++) {
                for (let j = 0; j <= CHUNCK_LENGTH; j++) {
                    let I = i + this.iPos * CHUNCK_LENGTH;
                    let J = j + this.jPos * CHUNCK_LENGTH;
                    let p = RAND.getValue4D(this.terrain.randSeed, I, J, 0, this.level);
                    p = ((p - 0.5) * 2) * 0.08 * Math.pow(2, this.level);
                    this.data[i][j] += p;
                }
            }
        }
    }

    public getGenMap(level: number, iPos: number, jPos: number): GenMap {
        if (this.level === level) {
            return this;
        }
        else {
            // Note : (this.levelFactor / 2) is wrong.
            if (!this.children) {
                this.subdivide();
            }
            let i = Math.floor((iPos - Math.pow(2, this.level - level) * this.iPos) / (Math.pow(2, this.level - level) / 2));
            let j = Math.floor((jPos - Math.pow(2, this.level - level) * this.jPos) / (Math.pow(2, this.level - level) / 2));
            i = Math.max(Math.min(i, 1), 0);
            j = Math.max(Math.min(j, 1), 0);
            let child = this.children[i][j];
            if (child instanceof GenMap) {
                return child.getGenMap(level, iPos, jPos);
            }
        }
        return undefined;
    }

    public subdivide(): GenMap[][] {
        if (this._subdivided) {
            return this.children;
        }
        this._subdivided = true;

        let maps: GenMap[][] = [
            [
                new GenMap(this.level - 1, this.iPos * 2, this.jPos * 2, this.terrain),
                new GenMap(this.level - 1, this.iPos * 2, this.jPos * 2 + 1, this.terrain)
            ],
            [
                new GenMap(this.level - 1, this.iPos * 2 + 1, this.jPos * 2, this.terrain),
                new GenMap(this.level - 1, this.iPos * 2 + 1, this.jPos * 2 + 1, this.terrain)
            ]
        ];

        this.children = maps;

        /*
        this.terrain.addGenMap(maps[0][0]);
        this.terrain.addGenMap(maps[1][0]);
        this.terrain.addGenMap(maps[1][1]);
        this.terrain.addGenMap(maps[0][1]);
        */
        
        for (let i = 0; i <= CHUNCK_LENGTH / 2; i++) {
            for (let j = 0; j <= CHUNCK_LENGTH / 2; j++) {
                maps[0][0].data[2 * i][2 * j] = this.data[i][j];
                maps[1][0].data[2 * i][2 * j] = this.data[i + CHUNCK_LENGTH / 2][j];
                maps[0][1].data[2 * i][2 * j] = this.data[i][j + CHUNCK_LENGTH / 2];
                maps[1][1].data[2 * i][2 * j] = this.data[i + CHUNCK_LENGTH / 2][j + CHUNCK_LENGTH / 2];
            }
        }
        
        for (let I = 0; I < 2; I++) {
            for (let J = 0; J < 2; J++) {
                let map = maps[I][J];

                for (let i = 0; i < CHUNCK_LENGTH / 2; i++) {
                    for (let j = 0; j <= CHUNCK_LENGTH; j++) {
                        let v1 = map.data[2 * i][j];
                        let v2 = map.data[2 * i + 2][j];
                        map.data[2 * i + 1][j] = v1 * 0.5 + v2 * 0.5;
                    }
                }

                for (let i = 0; i <= CHUNCK_LENGTH; i++) {
                    for (let j = 0; j < CHUNCK_LENGTH / 2; j++) {
                        let v1 = map.data[i][2 * j];
                        let v2 = map.data[i][2 * j + 2];
                        map.data[i][2 * j + 1] = v1 * 0.5 + v2 * 0.5;
                    }
                }

                for (let i = 0; i < CHUNCK_LENGTH / 2; i++) {
                    for (let j = 0; j < CHUNCK_LENGTH / 2; j++) {
                        let v1 = map.data[2 * i][2 * j];
                        let v2 = map.data[2 * i][2 * j + 2];
                        let v3 = map.data[2 * i + 2][2 * j];
                        let v4 = map.data[2 * i + 2][2 * j + 2];
                        map.data[2 * i + 1][2 * j + 1] = v1 * 0.25 + v2 * 0.25 + v3 * 0.25 + v4 * 0.25;
                    }
                }

                map.addData();
            }
        }

        return maps;
    }
}