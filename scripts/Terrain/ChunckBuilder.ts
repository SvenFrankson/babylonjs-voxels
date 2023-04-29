class ChunckMeshBuilder {

    private static FlatMesh: boolean = false;
	private static _Vertices: number[][][] = [];

    private static _GetVertex(i: number, j: number, k: number): number {
        i += 2;
        j += 2;
        k += 2;
        if (ChunckMeshBuilder.FlatMesh) {
            return undefined;
        }
		if (ChunckMeshBuilder._Vertices[i]) {
			if (ChunckMeshBuilder._Vertices[i][j]) {
				return ChunckMeshBuilder._Vertices[i][j][k];
			}
		}
	}

	private static _SetVertex(v: number, i: number, j: number, k: number): void {
        i += 2;
        j += 2;
        k += 2;
        if (ChunckMeshBuilder.FlatMesh) {
            return;
        }
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

        let m = chunck.m;
        let vertexLength = 2 * CHUNCK_LENGTH + 1;

        let data = chunck.data;
        let lod = 2;
        if (chunck.level === 0) {
            lod = 2;
        }

		let vertexData = new BABYLON.VertexData();
		let positions: number[] = [];
		let indices: number[] = [];
        let normals: number[] = [];

		for (let i = - m; i < CHUNCK_SIZE + m; i++) {
            for (let j = - m; j < CHUNCK_SIZE + m; j++) {
                for (let k = - m; k < CHUNCK_SIZE + m; k++) {

                    let ref = 0b0;
                    let d0 = data[i + m][j + m][k + m];
                    if (d0 > BlockType.Water) {
                        ref |= 0b1 << 0;
                    }
                    let d4 = data[i + m][j + m][k + m + 1];
                    if (d4 > BlockType.Water) {
                        ref |= 0b1 << 4;
                    }
                    let d1 = data[i + m + 1][j + m][k + m];
                    if (d1 > BlockType.Water) {
                        ref |= 0b1 << 1;
                    }
                    let d2 = data[i + m + 1][j + m + 1][k + m];
                    if (d2 > BlockType.Water) {
                        ref |= 0b1 << 2;
                    }
                    let d3 = data[i + m][j + m + 1][k + m];
                    if (d3 > BlockType.Water) {
                        ref |= 0b1 << 3;
                    }
                    let d5 = data[i + m + 1][j + m][k + m + 1];
                    if (d5 > BlockType.Water) {
                        ref |= 0b1 << 5;
                    }
                    let d6 = data[i + m + 1][j + m + 1][k + m + 1];
                    if (d6 > BlockType.Water) {
                        ref |= 0b1 << 6;
                    }
                    let d7 = data[i + m][j + m + 1][k + m + 1];
                    if (d7 > BlockType.Water) {
                        ref |= 0b1 << 7;
                    }

                    if (isFinite(ref) && ref != 0 && ref != 0b11111111) {
                        let extendedpartVertexData = ChunckVertexData.Get(lod, ref);
                        if (extendedpartVertexData) {
                            let fastData = extendedpartVertexData.fastData;
                            let fastNormals = extendedpartVertexData.fastNormals;
                            for (let dataIndex = 0; dataIndex < fastData.length / 9; dataIndex++) {
                                let triIndexes = [];
                                let addTri = true;
                                for (let n = 0; n < 3; n++) {
                                    let x = fastData[9 * dataIndex + 3 * n];
                                    let y = fastData[9 * dataIndex + 3 * n + 1];
                                    let z = fastData[9 * dataIndex + 3 * n + 2];

                                    let xIndex = x + i * 2;
                                    let yIndex = y + k * 2;
                                    let zIndex = z + j * 2;

                                    if (xIndex >= 0 && yIndex >= 0 && zIndex >= 0 && xIndex < vertexLength && yIndex < vertexLength && zIndex < vertexLength) {
                                        let pIndex = ChunckMeshBuilder._GetVertex(xIndex, yIndex, zIndex);
                                        if (!isFinite(pIndex)) {
                                            pIndex = positions.length / 3;
                                            positions.push(x * 0.5 + i, y * 0.5 + k, z * 0.5 + j);
                                            normals.push(0, 0, 0);
                                            ChunckMeshBuilder._SetVertex(pIndex, xIndex, yIndex, zIndex)
                                        }
                                        normals[3 * pIndex] += fastNormals[3 * dataIndex];
                                        normals[3 * pIndex + 1] += fastNormals[3 * dataIndex + 1];
                                        normals[3 * pIndex + 2] += fastNormals[3 * dataIndex + 2];
                                        triIndexes[n] = pIndex;
                                    }
                                    else {
                                        addTri = false;
                                    }
                                }

                                if (addTri) {
                                    indices.push(...triIndexes);
                                }
                            }
                        }
                    }
                }
			}
		}

        for (let i = 0; i < positions.length / 3; i++) {
            positions[3 * i] = positions[3 * i] * chunck.levelFactor;
            positions[3 * i + 1] = positions[3 * i + 1] * chunck.levelFactor;
            positions[3 * i + 2] = positions[3 * i + 2] * chunck.levelFactor;
        }

        for (let i = 0; i < normals.length / 3; i++) {
            let nx = normals[3 * i];
            let ny = normals[3 * i + 1];
            let nz = normals[3 * i + 2];
            let l = Math.sqrt(nx * nx + ny * ny + nz * nz);
            normals[3 * i] = nx / l;
            normals[3 * i + 1] = ny / l;
            normals[3 * i + 2] = nz / l;
        }
        //BABYLON.VertexData.ComputeNormals(positions, indices, normals);
		vertexData.positions = positions;
		vertexData.normals = normals;
		vertexData.indices = indices;
        

		return vertexData;
	}

    public static BuildMeshShell(chunck: Chunck, sides: number): BABYLON.VertexData {
		ChunckMeshBuilder._Vertices = [];

        let data = chunck.data;
        let lod = 2;
        if (chunck.level === 0) {
            lod = 2;
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
            iMin = - 1;
        }
        if (sides & 0b10) {
            iMax = CHUNCK_LENGTH + 1;
        }
        if (sides & 0b100) {
            jMin = - 1;
        }
        if (sides & 0b1000) {
            jMax = CHUNCK_LENGTH + 1;
        }
        if (sides & 0b10000) {
            kMin = - 1;
        }
        if (sides & 0b100000) {
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
                                let fastData = extendedpartVertexData.fastData;
                                for (let dataIndex = 0; dataIndex < fastData.length / 9; dataIndex++) {
                                    let x1 = fastData[9 * dataIndex + 0];
                                    let y1 = fastData[9 * dataIndex + 1];
                                    let z1 = fastData[9 * dataIndex + 2];

                                    let x2 = fastData[9 * dataIndex + 3];
                                    let y2 = fastData[9 * dataIndex + 4];
                                    let z2 = fastData[9 * dataIndex + 5];
                                    
                                    let x3 = fastData[9 * dataIndex + 6];
                                    let y3 = fastData[9 * dataIndex + 7];
                                    let z3 = fastData[9 * dataIndex + 8];

                                    let i1 = ChunckMeshBuilder._GetVertex(x1 + i * 2, y1 + k * 2, z1 + j * 2);
                                    if (!isFinite(i1)) {
                                        i1 = positions.length / 3;
                                        positions.push(x1 * 0.5 + i, y1 * 0.5 + k, z1 * 0.5 + j);
                                        ChunckMeshBuilder._SetVertex(i1, x1 + i * 2, y1 + k * 2, z1 + j * 2)
                                    }

                                    let i2 = ChunckMeshBuilder._GetVertex(x2 + i * 2, y2 + k * 2, z2 + j * 2);
                                    if (!isFinite(i2)) {
                                        i2 = positions.length / 3;
                                        positions.push(x2 * 0.5 + i, y2 * 0.5 + k, z2 * 0.5 + j);
                                        ChunckMeshBuilder._SetVertex(i2, x2 + i * 2, y2 + k * 2, z2 + j * 2)
                                    }

                                    let i3 = ChunckMeshBuilder._GetVertex(x3 + i * 2, y3 + k * 2, z3 + j * 2);
                                    if (!isFinite(i3)) {
                                        i3 = positions.length / 3;
                                        positions.push(x3 * 0.5 + i, y3 * 0.5 + k, z3 * 0.5 + j);
                                        ChunckMeshBuilder._SetVertex(i3, x3 + i * 2, y3 + k * 2, z3 + j * 2)
                                    }

                                    indices.push(i1, i2, i3);
                                }
                            }
                        }
                    }
                }
			}
		}

        for (let i = 0; i < positions.length / 3; i++) {
            positions[3 * i] = positions[3 * i] * chunck.levelFactor;
            positions[3 * i + 1] = positions[3 * i + 1] * chunck.levelFactor;
            positions[3 * i + 2] = positions[3 * i + 2] * chunck.levelFactor;
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