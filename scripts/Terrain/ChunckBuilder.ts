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
		let summedPositions: number[] = [];
        let summedPositionsCount: number[] = [];
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
                            let fastTriangles = extendedpartVertexData.fastTriangles;
                            let fastNormals = extendedpartVertexData.fastNormals;
                            for (let triIndex = 0; triIndex < fastTriangles.length; triIndex++) {
                                let triIndexes = [];
                                let addTri = true;
                                let sumX = 0;
                                let sumY = 0;
                                let sumZ = 0;
                                for (let vIndex = 0; vIndex < 3; vIndex++) {
                                    let x = fastTriangles[triIndex][vIndex].x;
                                    let y = fastTriangles[triIndex][vIndex].y;
                                    let z = fastTriangles[triIndex][vIndex].z;

                                    let xIndex = x + i * 2;
                                    let yIndex = y + k * 2;
                                    let zIndex = z + j * 2;

                                    x = x * 0.5 + i;
                                    y = y * 0.5 + k;
                                    z = z * 0.5 + j;

                                    sumX += x;
                                    sumY += y;
                                    sumZ += z;

                                    let pIndex = -1;
                                    if (xIndex >= 0 && yIndex >= 0 && zIndex >= 0 && xIndex < vertexLength && yIndex < vertexLength && zIndex < vertexLength) {
                                        pIndex = ChunckMeshBuilder._GetVertex(xIndex, yIndex, zIndex);
                                        if (!isFinite(pIndex)) {
                                            pIndex = positions.length / 3;
                                            positions.push(x, y, z);
                                            summedPositions.push(0, 0, 0);
                                            summedPositionsCount.push(0);
                                            normals.push(0, 0, 0);
                                            ChunckMeshBuilder._SetVertex(pIndex, xIndex, yIndex, zIndex)
                                        }

                                        if (xIndex === 0 || yIndex === 0 || zIndex === 0 || xIndex === (vertexLength - 1) || yIndex === (vertexLength - 1) || zIndex === (vertexLength - 1)) {
                                            normals[3 * pIndex] += fastNormals[triIndex].x;
                                            normals[3 * pIndex + 1] += fastNormals[triIndex].y;
                                            normals[3 * pIndex + 2] += fastNormals[triIndex].z;
                                        }
                                    }
                                    else {
                                        addTri = false;
                                    }
                                    triIndexes[vIndex] = pIndex;
                                }

                                for (let n1 = 0; n1 < 3; n1++) {
                                    let pIndex = triIndexes[n1];
                                    if (pIndex != - 1) {
                                        summedPositions[3 * pIndex] += sumX;
                                        summedPositions[3 * pIndex + 1] += sumY;
                                        summedPositions[3 * pIndex + 2] += sumZ;
                                        summedPositionsCount[pIndex] += 3;
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
            let factor = summedPositionsCount[i] / 3;
            positions[3 * i] = (summedPositions[3 * i] - factor * positions[3 * i]) / (summedPositionsCount[i] - factor);
            positions[3 * i + 1] = (summedPositions[3 * i + 1] - factor * positions[3 * i + 1]) / (summedPositionsCount[i] - factor);
            positions[3 * i + 2] = (summedPositions[3 * i + 2] - factor * positions[3 * i + 2]) / (summedPositionsCount[i] - factor);
        }

        for (let i = 0; i < positions.length / 3; i++) {
            positions[3 * i] = positions[3 * i] * chunck.levelFactor;
            positions[3 * i + 1] = positions[3 * i + 1] * chunck.levelFactor;
            positions[3 * i + 2] = positions[3 * i + 2] * chunck.levelFactor;
        }

        let computedNormals = [];
        BABYLON.VertexData.ComputeNormals(positions, indices, computedNormals);

        for (let i = 0; i < normals.length / 3; i++) {
            let nx = normals[3 * i];
            let ny = normals[3 * i + 1];
            let nz = normals[3 * i + 2];

            let lSquared = nx * nx + ny * ny + nz * nz;
            if (lSquared > 0) {
                let l = Math.sqrt(lSquared);
                computedNormals[3 * i] = nx / l;
                computedNormals[3 * i + 1] = ny / l;
                computedNormals[3 * i + 2] = nz / l;
            }
        }

		vertexData.positions = positions;
		vertexData.normals = computedNormals;
		vertexData.indices = indices;
        

		return vertexData;
	}

    public static BuildMeshShell(chunck: Chunck, sides: number): BABYLON.VertexData {

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
		let summedPositions: number[] = [];
        let summedPositionsCount: number[] = [];
		let indices: number[] = [];
        let normals: number[] = [];

        let iMin = - m;
        let jMin = - m;
        let kMin = - m;
        let iMax = CHUNCK_LENGTH + m;
        let jMax = CHUNCK_LENGTH + m;
        let kMax = CHUNCK_LENGTH + m;
        if (sides & 0b1) {
            iMin = 1;
        }
        if (sides & 0b10) {
            iMax = CHUNCK_LENGTH - 1;
        }
        if (sides & 0b100) {
            jMin = 1;
        }
        if (sides & 0b1000) {
            jMax = CHUNCK_LENGTH - 1;
        }
        if (sides & 0b10000) {
            kMin = 0;
        }
        if (sides & 0b100000) {
            kMax = CHUNCK_LENGTH - 1;
        }

        let getData = (ii: number, jj: number, kk: number) => {
            if (ii > iMin && jj > jMin && kk > kMin && ii < iMax && jj < jMax && kk < kMax) {
                return BlockType.None;
            }
            return data[ii + m][jj + m][kk + m];
        }

		for (let i = - m; i < CHUNCK_LENGTH + m; i++) {
            for (let j = - m; j < CHUNCK_LENGTH + m; j++) {
                for (let k = - m; k < CHUNCK_LENGTH + m; k++) {

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
                            let fastTriangles = extendedpartVertexData.fastTriangles;
                            let fastNormals = extendedpartVertexData.fastNormals;
                            for (let triIndex = 0; triIndex < fastTriangles.length; triIndex++) {
                                let triIndexes = [];
                                let addTri = true;
                                let sumX = 0;
                                let sumY = 0;
                                let sumZ = 0;
                                for (let vIndex = 0; vIndex < 3; vIndex++) {
                                    let x = fastTriangles[triIndex][vIndex].x;
                                    let y = fastTriangles[triIndex][vIndex].y;
                                    let z = fastTriangles[triIndex][vIndex].z;

                                    let xIndex = x + i * 2;
                                    let yIndex = y + k * 2;
                                    let zIndex = z + j * 2;

                                    x = x * 0.5 + i;
                                    y = y * 0.5 + k;
                                    z = z * 0.5 + j;

                                    sumX += x;
                                    sumY += y;
                                    sumZ += z;

                                    let pIndex = -1;
                                    if (xIndex >= 0 && yIndex >= 0 && zIndex >= 0 && xIndex < vertexLength && yIndex < vertexLength && zIndex < vertexLength) {
                                        pIndex = ChunckMeshBuilder._GetVertex(xIndex, yIndex, zIndex);
                                        if (!isFinite(pIndex)) {
                                            pIndex = positions.length / 3;
                                            positions.push(x, y, z);
                                            summedPositions.push(0, 0, 0);
                                            summedPositionsCount.push(0);
                                            normals.push(0, 0, 0);
                                            ChunckMeshBuilder._SetVertex(pIndex, xIndex, yIndex, zIndex)
                                        }

                                        if (xIndex === 0 || yIndex === 0 || zIndex === 0 || xIndex === (vertexLength - 1) || yIndex === (vertexLength - 1) || zIndex === (vertexLength - 1)) {
                                            normals[3 * pIndex] += fastNormals[triIndex].x;
                                            normals[3 * pIndex + 1] += fastNormals[triIndex].y;
                                            normals[3 * pIndex + 2] += fastNormals[triIndex].z;
                                        }
                                    }
                                    else {
                                        addTri = false;
                                    }
                                    triIndexes[vIndex] = pIndex;
                                }

                                for (let n1 = 0; n1 < 3; n1++) {
                                    let pIndex = triIndexes[n1];
                                    if (pIndex != - 1) {
                                        summedPositions[3 * pIndex] += sumX;
                                        summedPositions[3 * pIndex + 1] += sumY;
                                        summedPositions[3 * pIndex + 2] += sumZ;
                                        summedPositionsCount[pIndex] += 3;
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
            let factor = summedPositionsCount[i] / 3;
            positions[3 * i] = (summedPositions[3 * i] - factor * positions[3 * i]) / (summedPositionsCount[i] - factor);
            positions[3 * i + 1] = (summedPositions[3 * i + 1] - factor * positions[3 * i + 1]) / (summedPositionsCount[i] - factor);
            positions[3 * i + 2] = (summedPositions[3 * i + 2] - factor * positions[3 * i + 2]) / (summedPositionsCount[i] - factor);
        }

        for (let i = 0; i < positions.length / 3; i++) {
            positions[3 * i] = positions[3 * i] * chunck.levelFactor;
            positions[3 * i + 1] = positions[3 * i + 1] * chunck.levelFactor;
            positions[3 * i + 2] = positions[3 * i + 2] * chunck.levelFactor;
        }

        let computedNormals = [];
        BABYLON.VertexData.ComputeNormals(positions, indices, computedNormals);

        for (let i = 0; i < normals.length / 3; i++) {
            let nx = normals[3 * i];
            let ny = normals[3 * i + 1];
            let nz = normals[3 * i + 2];

            let lSquared = nx * nx + ny * ny + nz * nz;
            if (lSquared > 0) {
                let l = Math.sqrt(lSquared);
                computedNormals[3 * i] = nx / l;
                computedNormals[3 * i + 1] = ny / l;
                computedNormals[3 * i + 2] = nz / l;
            }
        }

		vertexData.positions = positions;
		vertexData.normals = computedNormals;
		vertexData.indices = indices;
        

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