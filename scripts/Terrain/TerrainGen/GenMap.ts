interface IGenMapProp {
    highestRandLevel: number
    lowestRandLevel: number
}

abstract class AbstractGenMap {
    public _dataSize: number;
    public abstract getRawData(i: number, j: number): number;
    
    public newer: any;
    public children: AbstractGenMap[][];
    public parent: AbstractGenMap;

    public _subdivided: boolean = false;
    public get subdivided(): boolean {
        return this._subdivided;
    }

    constructor(
        public index: number,
        public level: number,
        public iPos: number,
        public jPos: number,
        public terrain: Terrain
    ) {
        this._dataSize = CHUNCK_LENGTH + 1;
    }

    public abstract subdivide(): AbstractGenMap[][];

    public getGenMap(level: number, iPos: number, jPos: number): AbstractGenMap {
        if (this.level === level) {
            return this;
        }
        else {
            // Note : (this.levelFactor / 2) is wrong.
            if (!this.children) {
                this.subdivide();
            }
            let f = VMath.Pow2(this.level - level);
            let i = Math.floor((iPos - f * this.iPos) / (f / 2));
            let j = Math.floor((jPos - f * this.jPos) / (f / 2));
            i = Math.max(Math.min(i, 1), 0);
            j = Math.max(Math.min(j, 1), 0);
            let child = this.children[i][j];
            if (child instanceof AbstractGenMap) {
                return child.getGenMap(level, iPos, jPos);
            }
        }
        return undefined;
    }

    public getTexture(i0: number = 0, i1: number = 0, j0: number = 0, j1: number = 0, min: number = - 32768, max: number = 32768): BABYLON.Texture {
        let n = i1 - i0 + 1;
        let Sn = this._dataSize * VMath.Pow2(this.level);
        let S = Sn * n;

        let texture = new BABYLON.DynamicTexture("texture", S, undefined, false);
        let context = texture.getContext();

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                let map = this.terrain.getGenMap(this.index, this.level, this.iPos + i0 + i, this.jPos + j0 + j);
                map.recursiveDrawTexture(context, Sn, i * Sn, j * Sn, min, max);
            }
        }

        texture.update(false);

        return texture;
    }

    public recursiveDrawTexture(context: BABYLON.ICanvasRenderingContext, S: number, I: number, J: number, min: number, max: number): void {
        if (this.level === 0) {
            let data = new Uint8ClampedArray(this._dataSize * this._dataSize * 4);
            let l = max - min;
            for (let j = 0; j < this._dataSize; j++) {
                for (let i = 0; i < this._dataSize; i++) {
                    let n = i + j * this._dataSize;
                    let v = this.getRawData(i, j);
                    /*
                    let c = Math.floor((v - min) / l * 256);
                    
                    if (c >= 126 && c <= 128) {
                        data[4 * n] = 255;
                        data[4 * n + 1] = 0;
                        data[4 * n + 2] = 0;
                    }
                    else {
                        data[4 * n] = c;
                        data[4 * n + 1] = c;
                        data[4 * n + 2] = c;
                    }
                    */
                    let c = BiomeUtils.ValueToBiome(v);
                    data[4 * n] = Math.floor(BiomeColors[c].r * 255);
                    data[4 * n + 1] = Math.floor(BiomeColors[c].g * 255);
                    data[4 * n + 2] = Math.floor(BiomeColors[c].b * 255);
                    data[4 * n + 3] = 255;
                }
            }
            let imageData = new ImageData(data, this._dataSize);
            context.putImageData(imageData, I, J);
        }
        else {
            let S2 = S * 0.5;
            if (!this.subdivided) {
                this.subdivide();
            }
            this.children[0][0].recursiveDrawTexture(context, S2, I, J, min, max);
            this.children[1][0].recursiveDrawTexture(context, S2, I + S2, J, min, max);
            this.children[0][1].recursiveDrawTexture(context, S2, I, J + S2, min, max);
            this.children[1][1].recursiveDrawTexture(context, S2, I + S2, J + S2, min, max);
        }
    }
}

class GenMap extends AbstractGenMap {

    public _data: Int16Array;
    public getRawData(i: number, j: number): number {
        return this._data[i + j * this._dataSize];
    }
    public setRawData(v: number, i: number, j: number): number {
        return this._data[i + j * this._dataSize] = v;
    }

    private _amplitudeFactor: number = 1;

    private _peakDistance: number;
    public get peakDistance(): number {
        return this._peakDistance;
    }

    public randIGlobal: number;
    public randJGlobal: number;
    public randNumber: number;

    constructor(
        index: number,
        level: number,
        iPos: number,
        jPos: number,
        terrain: Terrain,
        public prop: IGenMapProp
    ) {
        super(index, level, iPos, jPos, terrain);
        this._data = new Int16Array(this._dataSize * this._dataSize);
        this._data.fill(0);
        this._amplitudeFactor = VMath.Pow2(14 - this.prop.highestRandLevel);
        this._peakDistance = VMath.Pow2(this.prop.highestRandLevel - 1);
        
        let f = VMath.Pow2(this.level);
        let iGlobal = (this.iPos + 0.5) * f * CHUNCK_LENGTH;
        let pI = (RAND.getValue3D(this.terrain.randSeed, this.iPos, this.jPos, this.index + this.level) * 2 - 1) *  f * CHUNCK_LENGTH / 3;
        //let pI = (Math.random() * 2 - 1) *  f * CHUNCK_LENGTH / 3;
        this.randIGlobal = Math.floor(iGlobal + pI);
        let jGlobal = (this.jPos + 0.5) * f * CHUNCK_LENGTH;
        //let pJ = (Math.random() * 2 - 1) * f * CHUNCK_LENGTH / 3;
        let pJ = (RAND.getValue3D(this.terrain.randSeed, this.jPos, this.index + this.iPos, this.level) * 2 - 1) * f * CHUNCK_LENGTH / 3;
        this.randJGlobal = Math.floor(jGlobal + pJ);

        this.randNumber = RAND.getValue4D(this.terrain.randSeed, this.index, this.iPos, this.level, this.jPos);
    }

    public addData(): void {
        if (this.level >= this.prop.lowestRandLevel && this.level <= this.prop.highestRandLevel) {
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
            let f = VMath.Pow2(this.level);
            for (let i = 0; i <= CHUNCK_LENGTH; i++) {
                for (let j = 0; j <= CHUNCK_LENGTH; j++) {
                    let I = i + this.iPos * CHUNCK_LENGTH;
                    let J = j + this.jPos * CHUNCK_LENGTH;
                    let p = RAND.getValue4D(this.terrain.randSeed, I, this.index, J, this.level) * 2 - 1;
                    p = p * f * this._amplitudeFactor;
                    this._data[i + j * this._dataSize] += p;
                }
            }
        }
    }

    public subdivide(): GenMap[][] {
        if (this._subdivided) {
            return this.children as GenMap[][];
        }
        this._subdivided = true;

        this.children = [
            [
                new GenMap(this.index, this.level - 1, this.iPos * 2, this.jPos * 2, this.terrain, this.prop),
                new GenMap(this.index, this.level - 1, this.iPos * 2, this.jPos * 2 + 1, this.terrain, this.prop)
            ],
            [
                new GenMap(this.index, this.level - 1, this.iPos * 2 + 1, this.jPos * 2, this.terrain, this.prop),
                new GenMap(this.index, this.level - 1, this.iPos * 2 + 1, this.jPos * 2 + 1, this.terrain, this.prop)
            ]
        ];
        this.children[0][0].parent = this;
        this.children[1][0].parent = this;
        this.children[0][1].parent = this;
        this.children[1][1].parent = this;

        /*
        this.terrain.addGenMap(maps[0][0]);
        this.terrain.addGenMap(maps[1][0]);
        this.terrain.addGenMap(maps[1][1]);
        this.terrain.addGenMap(maps[0][1]);
        */
        
        let children = this.children as GenMap[][];
        for (let i = 0; i <= CHUNCK_LENGTH / 2; i++) {
            for (let j = 0; j <= CHUNCK_LENGTH / 2; j++) {
                children[0][0].setRawData(this.getRawData(i, j), 2 * i, 2 * j);
                children[1][0].setRawData(this.getRawData(i + CHUNCK_LENGTH / 2, j), 2 * i, 2 * j);
                children[0][1].setRawData(this.getRawData(i, j + CHUNCK_LENGTH / 2), 2 * i, 2 * j);
                children[1][1].setRawData(this.getRawData(i + CHUNCK_LENGTH / 2, j + CHUNCK_LENGTH / 2), 2 * i, 2 * j);
            }
        }
        
        for (let I = 0; I < 2; I++) {
            for (let J = 0; J < 2; J++) {
                let map = children[I][J];

                for (let i = 0; i < CHUNCK_LENGTH / 2; i++) {
                    for (let j = 0; j <= CHUNCK_LENGTH; j++) {
                        let v1 = map.getRawData(2 * i, j);
                        let v2 = map.getRawData(2 * i + 2, j);
                        map.setRawData(v1 * 0.5 + v2 * 0.5, 2 * i + 1, j);
                    }
                }

                for (let i = 0; i <= CHUNCK_LENGTH; i++) {
                    for (let j = 0; j < CHUNCK_LENGTH / 2; j++) {
                        let v1 = map.getRawData(i, 2 * j);
                        let v2 = map.getRawData(i, 2 * j + 2);
                        map.setRawData(v1 * 0.5 + v2 * 0.5, i, 2 * j + 1);
                    }
                }

                for (let i = 0; i < CHUNCK_LENGTH / 2; i++) {
                    for (let j = 0; j < CHUNCK_LENGTH / 2; j++) {
                        let v1 = map.getRawData(2 * i, 2 * j);
                        let v2 = map.getRawData(2 * i, 2 * j + 2);
                        let v3 = map.getRawData(2 * i + 2, 2 * j);
                        let v4 = map.getRawData(2 * i + 2, 2 * j + 2);
                        map.setRawData(v1 * 0.25 + v2 * 0.25 + v3 * 0.25 + v4 * 0.25, 2 * i + 1, 2 * j + 1);
                    }
                }

                map.addData();
            }
        }

        return children;
    }

    public getDataHeightMap(hMax: number, i: number, j: number): number {
        return this.getRawData(i, j) / 32768 * hMax;
    }

    public getDataTunnel(amplitude: number, hRatio: number, i: number, j: number): number {
        let d = (this.getRawData(i, j)) / 32768 * this.peakDistance * hRatio;
        d = Math.abs(d);
        if (d <= amplitude) {
            d = Math.cos(Math.PI * d / amplitude);
            d = Math.sqrt(d) * amplitude;
        }
        else {
            d = 0;
        }
        return d;
    }
}

class ComposedGenMap extends AbstractGenMap {
   
    public getRawData(i: number, j: number): number {
        let d0 = this.genMaps[0]._data[i + j * this._dataSize];
        let d1 = this.genMaps[1]._data[i + j * this._dataSize];
        
        let v0 = (d0 / 32768);
        v0 = Math.sign(v0) * Math.sqrt(Math.abs(v0));
        v0 = v0 * 32768;
        return v0;

        let v1 = (d1 + 32768) / 65536;
        v1 = Math.sign(v1) * Math.sqrt(Math.abs(v1));

        let vv0 = Math.floor(v0 * 4);
        let vv1 = Math.floor(v1 * 4);

        let vTotal = (vv0 * 4 + vv1 + 0.5) / 16;

        return ((vTotal - 0.5)) * 32768 * 2;

        return this.genMaps[0]._data[i + j * this._dataSize] * 0.5 + this.genMaps[1]._data[i + j * this._dataSize] * 0.5;
    }

    constructor(
        index: number,
        level: number,
        iPos: number,
        jPos: number,
        terrain: Terrain,
        public genMaps: GenMap[]
    ) {
        super(index, level, iPos, jPos, terrain);
    }

    public subdivide(): ComposedGenMap[][] {
        if (this._subdivided) {
            return this.children as ComposedGenMap[][];
        }
        this._subdivided = true;

        let children0 = this.genMaps[0].children as GenMap[][];
        let children1 = this.genMaps[1].children as GenMap[][];
        this.children = [
            [
                new ComposedGenMap(this.index, this.level - 1, this.iPos * 2, this.jPos * 2, this.terrain, [children0[0][0], children1[0][0]]),
                new ComposedGenMap(this.index, this.level - 1, this.iPos * 2, this.jPos * 2 + 1, this.terrain, [children0[0][1], children1[0][1]])
            ],
            [
                new ComposedGenMap(this.index, this.level - 1, this.iPos * 2 + 1, this.jPos * 2, this.terrain, [children0[1][0], children1[1][0]]),
                new ComposedGenMap(this.index, this.level - 1, this.iPos * 2 + 1, this.jPos * 2 + 1, this.terrain, [children0[1][1], children1[1][1]])
            ]
        ];
        this.children[0][0].parent = this;
        this.children[1][0].parent = this;
        this.children[0][1].parent = this;
        this.children[1][1].parent = this;

        return this.children as ComposedGenMap[][];
    }
}