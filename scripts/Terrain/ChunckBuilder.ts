class ChunckMeshBuilder {

	private static _Vertices: number[][][] = [];

    private static _GetVertex(i: number, j: number, k: number): number {
		if (ChunckMeshBuilder._Vertices[i]) {
			if (ChunckMeshBuilder._Vertices[i][j]) {
				return ChunckMeshBuilder._Vertices[i][j][k];
			}
		}
	}

	private static _SetVertex(v: number, i: number, j: number, k: number): void {
		if (!ChunckMeshBuilder._Vertices[i]) {
			ChunckMeshBuilder._Vertices[i] = [];
		}
		if (!ChunckMeshBuilder._Vertices[i][j]) {
			ChunckMeshBuilder._Vertices[i][j] = [];
		}
		ChunckMeshBuilder._Vertices[i][j][k] = v;
	}

    public static BuildMesh(chunck: Chunck): BABYLON.VertexData {
		ChunckMeshBuilder._Vertices = [];

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

                                let existingIndex = ChunckMeshBuilder._GetVertex(Math.round(10 * (x + 1)), Math.round(10 * (y + 1)), Math.round(10 * (z + 1)));
                                if (isFinite(existingIndex)) {
                                    partIndexes[p] = existingIndex;
                                }
                                else {
                                    let l = positions.length / 3;
                                    ChunckMeshBuilder._SetVertex(l, Math.round(10 * (x + 1)), Math.round(10 * (y + 1)), Math.round(10 * (z + 1)));
                                    partIndexes[p] = l;
                                    positions.push(
                                        x * chunck.levelFactor + 0.5,
                                        y * chunck.levelFactor + 0.5 * chunck.levelFactor,
                                        z * chunck.levelFactor + 0.5
                                    );
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

    public static BuildMeshShell(chunck: Chunck, sides: number): BABYLON.VertexData {
		ChunckMeshBuilder._Vertices = [];

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
        if (sides & 0b1) {
            console.log("a");
            iMin = - 1;
        }
        if (sides & 0b10) {
            console.log("b");
            iMax = CHUNCK_LENGTH + 1;
        }
        if (sides & 0b100) {
            console.log("c");
            jMin = - 1;
        }
        if (sides & 0b1000) {
            console.log("d");
            jMax = CHUNCK_LENGTH + 1;
        }
        if (sides & 0b10000) {
            console.log("e");
            kMin = - 1;
        }
        if (sides & 0b100000) {
            console.log("f");
            kMax = CHUNCK_LENGTH + 1;
        }

		for (let i = iMin ; i < iMax; i++) {
            for (let j = jMin ; j < jMax; j++) {
                for (let k = kMin ; k < kMax; k++) {
                    if (i < 0 || i === CHUNCK_LENGTH || j < 0 || j === CHUNCK_LENGTH || k < 0 || k === CHUNCK_LENGTH) {
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

                                    let existingIndex = ChunckMeshBuilder._GetVertex(Math.round(10 * (x + 1)), Math.round(10 * (y + 1)), Math.round(10 * (z + 1)));
                                    if (isFinite(existingIndex)) {
                                        partIndexes[p] = existingIndex;
                                    }
                                    else {
                                        let l = positions.length / 3;
                                        ChunckMeshBuilder._SetVertex(l, Math.round(10 * (x + 1)), Math.round(10 * (y + 1)), Math.round(10 * (z + 1)));
                                        partIndexes[p] = l;
                                        positions.push(
                                            x * chunck.levelFactor + 0.5,
                                            y * chunck.levelFactor + 0.5 * chunck.levelFactor,
                                            z * chunck.levelFactor + 0.5
                                        );
                                    }

                                }
                                indices.push(...vData.indices.map(index => { return partIndexes[index]; }));
                            }
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