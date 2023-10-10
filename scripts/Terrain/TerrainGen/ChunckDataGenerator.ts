class ChunckDataGenerator {

    public static _TmpGenMaps0: GenMap[][] = [[], [], []];
    public static _TmpGenMaps1: GenMap[][] = [[], [], []];
    public static _TmpGenMaps2: GenMap[][] = [[], [], []];
    public static _TmpGenMaps3: GenMap[][] = [[], [], []];
    public static _TmpGenMaps4: GenMap[][] = [[], [], []];
    public static _TmpGenMaps5: GenMap[][] = [[], [], []];
    
    public static InitializeData(chunck: Chunck): void {
        
        let biomesRef: IBiomesValue = {
            biomeA: 0,
            biomeB: 0,
            f: 0
        };

        let m = DRAW_CHUNCK_MARGIN;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                Chunck._TmpGenMaps0[i][j] = chunck.terrain.getGenMap(0, chunck.level, chunck.iPos - 1 + i, chunck.jPos - 1 + j) as GenMap;                
                Chunck._TmpGenMaps1[i][j] = chunck.terrain.getGenMap(1, chunck.level, chunck.iPos - 1 + i, chunck.jPos - 1 + j) as GenMap;
                Chunck._TmpGenMaps2[i][j] = chunck.terrain.getGenMap(2, chunck.level, chunck.iPos - 1 + i, chunck.jPos - 1 + j) as GenMap;
                Chunck._TmpGenMaps3[i][j] = chunck.terrain.getGenMap(3, chunck.level, chunck.iPos - 1 + i, chunck.jPos - 1 + j) as GenMap;
                Chunck._TmpGenMaps4[i][j] = chunck.terrain.getGenMap(4, chunck.level, chunck.iPos - 1 + i, chunck.jPos - 1 + j) as GenMap;
                Chunck._TmpGenMaps5[i][j] = chunck.terrain.getGenMap(5, chunck.level, chunck.iPos - 1 + i, chunck.jPos - 1 + j) as GenMap;
            }
        }
        
        if (!chunck.dataInitialized) {

            for (let i: number = - m; i <= CHUNCK_LENGTH + m; i++) {
                let iGlobal = chunck.iPos * chunck.levelFactor * CHUNCK_LENGTH + i * chunck.levelFactor;
                for (let j: number = - m; j <= CHUNCK_LENGTH + m; j++) {
                    let jGlobal = chunck.jPos * chunck.levelFactor * CHUNCK_LENGTH + j * chunck.levelFactor;

                    let IMap = 1;
                    let JMap = 1;
                    let ii = i;
                    if (ii < 0) {
                        ii += CHUNCK_LENGTH;
                        IMap--;
                    }
                    if (ii > CHUNCK_LENGTH) {
                        ii -= CHUNCK_LENGTH;
                        IMap++;
                    }
                    let jj = j;
                    if (jj < 0) {
                        jj += CHUNCK_LENGTH;
                        JMap--;
                    }
                    if (jj > CHUNCK_LENGTH) {
                        jj -= CHUNCK_LENGTH;
                        JMap++;
                    }

                    let holeHeight = Chunck._TmpGenMaps1[IMap][JMap].getDataTunnel(15, BLOCK_SIZE_M / BLOCK_HEIGHT_M, ii, jj);
                    let hAltitudeHole = Chunck._TmpGenMaps2[IMap][JMap].getDataHeightMap(chunck.terrain.halfTerrainHeight, ii, jj) + chunck.terrain.halfTerrainHeight;
                    let hColor = Chunck._TmpGenMaps3[IMap][JMap].getDataHeightMap(chunck.terrain.halfTerrainHeight, ii, jj) + chunck.terrain.halfTerrainHeight;
                    let rockHeight = Chunck._TmpGenMaps4[IMap][JMap].getDataTunnel(4, BLOCK_SIZE_M / BLOCK_HEIGHT_M, ii, jj);

                    BiomeUtils.ValueToBiomesToRef(Chunck._TmpGenMaps5[IMap][JMap].getRawData(ii, jj), biomesRef);

                    let altFactor = BiomeAltFactor[biomesRef.biomeA] * biomesRef.f + BiomeAltFactor[biomesRef.biomeB] * (1 - biomesRef.f);
                    let bestBiome = biomesRef.biomeA;
                    if (biomesRef.f < 0.5) {
                        bestBiome = biomesRef.biomeB;
                    }

                    let hAltitude = Chunck._TmpGenMaps0[IMap][JMap].getDataHeightMap(chunck.terrain.halfTerrainHeight * altFactor, ii, jj) + chunck.terrain.halfTerrainHeight;

                    for (let k: number = - m; k <= CHUNCK_LENGTH + m; k++) {
                        let kGlobal = chunck.kPos * chunck.levelFactor * CHUNCK_LENGTH + k * chunck.levelFactor;
                        
                        chunck.setRawData(BlockType.None, i + m, j + m, k + m);
                        if (Math.abs(kGlobal - hAltitude) < rockHeight) {
                            chunck.setRawData(BlockType.Rock, i + m, j + m, k + m);
                        }
                        else if (Math.abs(kGlobal - hAltitudeHole) < holeHeight) {
                            chunck.setRawData(BlockType.None, i + m, j + m, k + m);
                        }
                        else if (kGlobal < hAltitude) {

                            if (bestBiome === Biome.Forest) {
                                if (hColor > chunck.terrain.halfTerrainHeight) {
                                    chunck.setRawData(BlockType.Grass, i + m, j + m, k + m);
                                }
                                else {
                                    chunck.setRawData(BlockType.Dirt, i + m, j + m, k + m);
                                }
                            }

                            else if (bestBiome === Biome.Cold) {
                                chunck.setRawData(BlockType.Snow, i + m, j + m, k + m);
                            }

                            else if (bestBiome === Biome.Desert) {
                                chunck.setRawData(BlockType.Sand, i + m, j + m, k + m);
                            }
                        }
                        else {
                            chunck.setRawData(BlockType.None, i + m, j + m, k + m);
                        }
                    }
                }
            }
        }
    }
}