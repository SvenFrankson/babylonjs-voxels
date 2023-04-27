class ChunckMeshBuilder {

    private static SIZE = 200; 
	private static _Vertices: Int16Array = new Int16Array(ChunckMeshBuilder.SIZE * ChunckMeshBuilder.SIZE * ChunckMeshBuilder.SIZE);

    private static _GetVertex(i: number, j: number, k: number): number {
        if (i < 0 || j < 0 || k < 0) {
            debugger;
        }
		return ChunckMeshBuilder._Vertices[i * ChunckMeshBuilder.SIZE * ChunckMeshBuilder.SIZE + j * ChunckMeshBuilder.SIZE + k];
	}

	private static _SetVertex(v: number, i: number, j: number, k: number): void {
        if (i < 0 || j < 0 || k < 0) {
            debugger;
        }
		ChunckMeshBuilder._Vertices[i * ChunckMeshBuilder.SIZE * ChunckMeshBuilder.SIZE + j * ChunckMeshBuilder.SIZE + k] = v;
	}

	private static _ClearVertices(): void {
        ChunckMeshBuilder._Vertices.fill(-1);
	}

    public static BuildMesh(chunck: Chunck): BABYLON.VertexData {
        ChunckMeshBuilder._ClearVertices();

        let data = chunck.data;
        let lod = 2;
        if (chunck.level === 0) {
            lod = 0;
        }

		let vertexData = new BABYLON.VertexData();
		let positions: number[] = [];
		let indices: number[] = [];
        let normals: number[] = [];

		for (let i = 0; i < CHUNCK_SIZE; i++) {
            for (let j = 0; j < CHUNCK_SIZE; j++) {
                for (let k = 0; k < CHUNCK_SIZE; k++) {

                    let ref = 0b0;
                    let d0 = data[i][j][k];
                    if (d0 > BlockType.Water) {
                        ref |= 0b1 << 0;
                    }
                    let d4 = data[i][j][k + 1];
                    if (d4 > BlockType.Water) {
                        ref |= 0b1 << 4;
                    }
                    let d1 = data[i + 1][j][k];
                    if (d1 > BlockType.Water) {
                        ref |= 0b1 << 1;
                    }
                    let d2 = data[i + 1][j + 1][k];
                    if (d2 > BlockType.Water) {
                        ref |= 0b1 << 2;
                    }
                    let d3 = data[i][j + 1][k];
                    if (d3 > BlockType.Water) {
                        ref |= 0b1 << 3;
                    }
                    let d5 = data[i + 1][j][k + 1];
                    if (d5 > BlockType.Water) {
                        ref |= 0b1 << 5;
                    }
                    let d6 = data[i + 1][j + 1][k + 1];
                    if (d6 > BlockType.Water) {
                        ref |= 0b1 << 6;
                    }
                    let d7 = data[i][j + 1][k + 1];
                    if (d7 > BlockType.Water) {
                        ref |= 0b1 << 7;
                    }

                    if (isFinite(ref) && ref != 0 && ref != 0b11111111) {
                        let extendedpartVertexData = ChunckVertexData.Get(lod, ref);
                        if (extendedpartVertexData) {
                            let vData = extendedpartVertexData.vertexData;
                            let partIndexes = [];
                            for (let p = 0; p < vData.positions.length / 3; p++) {
                                let x = (vData.positions[3 * p] + i);
                                let y = (vData.positions[3 * p + 1] + k);
                                let z = (vData.positions[3 * p + 2] + j);

                                let existingIndex = ChunckMeshBuilder._GetVertex(Math.round(8 * x), Math.round(8 * y), Math.round(8 * z));
                                if (existingIndex != - 1) {
                                    partIndexes[p] = existingIndex;
                                }
                                else {
                                    let l = positions.length / 3;
                                    ChunckMeshBuilder._SetVertex(l, Math.round(8 * x), Math.round(8 * y), Math.round(8 * z));
                                    partIndexes[p] = l;
                                    positions.push(x * chunck.levelFactor + 0.5, y * chunck.levelFactor + 0.5 * chunck.levelFactor, z * chunck.levelFactor + 0.5);
                                }

                            }
                            indices.push(...vData.indices.map(index => { return partIndexes[index]; }));
                        }
                    }
                }
			}
		}

        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
		vertexData.positions = positions;
		vertexData.indices = indices;
		vertexData.normals = normals;

		return vertexData;
	}

    public static BuildMeshShell(chunck: Chunck): BABYLON.VertexData {
        ChunckMeshBuilder._ClearVertices();

        let data = chunck.data;
        let lod = 2;
        if (chunck.level === 0) {
            lod = 0;
        }

		let vertexData = new BABYLON.VertexData();
		let positions: number[] = [];
		let indices: number[] = [];
        let normals: number[] = [];

        let getData = (ii, jj, kk) => {
            if (ii < 0 || jj < 0 || kk < 0) {
                return BlockType.None;
            }
            if (ii > CHUNCK_LENGTH || jj > CHUNCK_LENGTH || kk > CHUNCK_LENGTH) {
                return BlockType.None;
            }
            return data[ii][jj][kk];
        }

        let iMin = 0;
        let jMin = 0;
        let kMin = 0;
        let iMax = CHUNCK_LENGTH;
        let jMax = CHUNCK_LENGTH;
        let kMax = CHUNCK_LENGTH;
        if (chunck.povDir.x > 0) {
            iMax = CHUNCK_LENGTH + 1;
        }
        else {
            iMin = - 1;
        }
        if (chunck.povDir.y > 0) {
            kMax = CHUNCK_LENGTH + 1;
        }
        else {
            kMin = - 1;
        }
        if (chunck.povDir.z > 0) {
            jMax = CHUNCK_LENGTH + 1;
        }
        else {
            jMin = - 1;
        }

		for (let i = iMin ; i < iMax; i++) {
            for (let j = jMin ; j < jMax; j++) {
                for (let k = kMin ; k < kMax; k++) {

                    let ref = 0b0;
                    let d0 = getData(i, j, k);
                    if (d0 > BlockType.Water) {
                        ref |= 0b1 << 0;
                    }
                    let d4 = getData(i, j, k + 1);
                    if (d4 > BlockType.Water) {
                        ref |= 0b1 << 4;
                    }
                    let d1 = getData(i + 1, j, k);
                    if (d1 > BlockType.Water) {
                        ref |= 0b1 << 1;
                    }
                    let d2 = getData(i + 1, j + 1, k);
                    if (d2 > BlockType.Water) {
                        ref |= 0b1 << 2;
                    }
                    let d3 = getData(i, j + 1, k);
                    if (d3 > BlockType.Water) {
                        ref |= 0b1 << 3;
                    }
                    let d5 = getData(i + 1, j, k + 1);
                    if (d5 > BlockType.Water) {
                        ref |= 0b1 << 5;
                    }
                    let d6 = getData(i + 1, j + 1, k + 1);
                    if (d6 > BlockType.Water) {
                        ref |= 0b1 << 6;
                    }
                    let d7 = getData(i, j + 1, k + 1);
                    if (d7 > BlockType.Water) {
                        ref |= 0b1 << 7;
                    }

                    if (isFinite(ref) && ref != 0 && ref != 0b11111111) {
                        let extendedpartVertexData = ChunckVertexData.Get(lod, ref);
                        if (extendedpartVertexData) {
                            let vData = extendedpartVertexData.vertexData;
                            let partIndexes = [];
                            for (let p = 0; p < vData.positions.length / 3; p++) {
                                let x = (vData.positions[3 * p] + i);
                                let y = (vData.positions[3 * p + 1] + k);
                                let z = (vData.positions[3 * p + 2] + j);

                                let existingIndex = ChunckMeshBuilder._GetVertex(Math.round(8 * (x - iMin)), Math.round(8 * (y - kMin)), Math.round(8 * (z - jMin)));
                                if (existingIndex != - 1) {
                                    partIndexes[p] = existingIndex;
                                }
                                else {
                                    let l = positions.length / 3;
                                    ChunckMeshBuilder._SetVertex(l, Math.round(8 * (x - iMin)), Math.round(8 * (y - kMin)), Math.round(8 * (z - jMin)));
                                    partIndexes[p] = l;
                                    positions.push(x * chunck.levelFactor + 0.5, y * chunck.levelFactor + 0.5 * chunck.levelFactor, z * chunck.levelFactor + 0.5);
                                }

                            }
                            indices.push(...vData.indices.map(index => { return partIndexes[index]; }));
                        }
                    }
                }
			}
		}

        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
		vertexData.positions = positions;
		vertexData.indices = indices;
		vertexData.normals = normals;

		return vertexData;
	}

    public static BuildVertexData(chunck: Chunck): BABYLON.VertexData {
        let vertexData = new BABYLON.VertexData();
        let positions: number[] = [];
        let indices: number[] = [];
        let normals: number[] = [];

        let levelCoef = chunck.levelFactor;
        let vertexCount = CHUNCK_LENGTH;

        for (let i = 0; i <= vertexCount; i++) {
            for (let j = 0; j <= vertexCount; j++) {
                let l = positions.length / 3;
                let x = i * levelCoef * BLOCK_SIZE;
                let y = 0;
                let z = j * levelCoef * BLOCK_SIZE;
                
                positions.push(x, y, z);

                if (i < vertexCount && j < vertexCount) {
                    indices.push(l, l + 1 + (vertexCount + 1), l + 1);
                    indices.push(l, l + (vertexCount + 1), l + 1 + (vertexCount + 1));
                }
            }
        }

        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;

        return vertexData;
    }
}

var CMB = ChunckMeshBuilder;