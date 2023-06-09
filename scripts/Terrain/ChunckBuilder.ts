class ChunckMeshBuilder {

    private static _BaseVerticesCount: number = 2 * CHUNCK_LENGTH + 1;
    private static _ReferencesLength: number = CHUNCK_LENGTH + 2 * DRAW_CHUNCK_MARGIN;
    private static _DataLength: number = CHUNCK_LENGTH + 2 * DRAW_CHUNCK_MARGIN + 1;
    private static FlatMesh: boolean = false;
	private static _Vertices: number[][][] = [];
    private static _References: Uint8Array = new Uint8Array(ChunckMeshBuilder._ReferencesLength * ChunckMeshBuilder._ReferencesLength * ChunckMeshBuilder._ReferencesLength);
    private static _Colors: Uint8Array = new Uint8Array(ChunckMeshBuilder._DataLength * ChunckMeshBuilder._DataLength * ChunckMeshBuilder._DataLength);

    private static _GetVertex(i: number, j: number, k: number): number {
        i += DRAW_CHUNCK_MARGIN;
        j += DRAW_CHUNCK_MARGIN;
        k += DRAW_CHUNCK_MARGIN;
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
        i += DRAW_CHUNCK_MARGIN;
        j += DRAW_CHUNCK_MARGIN;
        k += DRAW_CHUNCK_MARGIN;
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
    
    public static BuildMesh(chunck: Chunck, sides: number): BABYLON.VertexData {
		ChunckMeshBuilder._Vertices = [];

        let m = DRAW_CHUNCK_MARGIN;

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
        let colors: number[] = [];

        let xMin = 0;
        let yMin = 0;
        let zMin = 0;
        let xMax = ChunckMeshBuilder._BaseVerticesCount;
        let yMax = ChunckMeshBuilder._BaseVerticesCount;
        let zMax = ChunckMeshBuilder._BaseVerticesCount;
        if (sides & 0b1) {
            xMin = - 2;
        }
        if (sides & 0b10) {
            xMax = ChunckMeshBuilder._BaseVerticesCount + 2;
        }
        if (sides & 0b100) {
            zMin = - 2;
        }
        if (sides & 0b1000) {
            zMax = ChunckMeshBuilder._BaseVerticesCount + 2;
        }
        if (sides & 0b10000) {
            yMin = - 2;
        }
        if (sides & 0b100000) {
            yMax = ChunckMeshBuilder._BaseVerticesCount + 2;
        }

        let getData: (ii: number, jj: number, kk: number) => number;

        if (sides > 0) {
            getData = (ii: number, jj: number, kk: number) => {
                if (ii <= -1 && sides & 0b1) {
                    return BlockType.None;
                }
                if (jj <= -1 && sides & 0b100) {
                    return BlockType.None;
                }
                if (kk <= 0 && sides & 0b10000) {
                    return BlockType.None;
                }
                if (ii >= CHUNCK_LENGTH + 1 && sides & 0b10) {
                    return BlockType.None;
                }
                if (jj >= CHUNCK_LENGTH + 1 && sides & 0b1000) {
                    return BlockType.None;
                }
                if (kk >= CHUNCK_LENGTH + 1 && sides & 0b100000) {
                    return BlockType.None;
                }
                
                return chunck.getRawData(ii + m, jj + m, kk + m);
            }
        }
        else {
            getData = (ii: number, jj: number, kk: number) => {            
                return chunck.getRawData(ii + m, jj + m, kk + m);
            }
        }

        let l = ChunckMeshBuilder._ReferencesLength;
        let references = ChunckMeshBuilder._References;
        references.fill(0);
        let clonedData = ChunckMeshBuilder._Colors;
        clonedData.fill(0);
        for (let k = - m; k <= CHUNCK_LENGTH + m; k++) {
            for (let j = - m; j <= CHUNCK_LENGTH + m; j++) {
                for (let i = - m; i <= CHUNCK_LENGTH + m; i++) {
                    let data = getData(i, j, k);
                    if (data > BlockType.Water) {
                        let ii = i + m;
                        let jj = j + m;
                        let kk = k + m;
                        clonedData[ii + jj * l + kk * l * l] = data;
                        references[ii + jj * l + kk * l * l] |= 0b1 << 0;
                        if (ii > 0) {
                            references[(ii - 1) + jj * l + kk * l * l] |= 0b1 << 1;
                        }
                        if (ii > 0 && jj > 0) {
                            references[(ii - 1) + (jj - 1) * l + kk * l * l] |= 0b1 << 2;
                        }
                        if (jj > 0) {
                            references[ii + (jj - 1) * l + kk * l * l] |= 0b1 << 3;
                        }
                        if (kk > 0) {
                            references[ii + jj * l + (kk - 1) * l * l] |= 0b1 << 4;
                        }
                        if (ii > 0 && kk > 0) {
                            references[(ii - 1) + jj * l + (kk - 1) * l * l] |= 0b1 << 5;
                        }
                        if (ii > 0 && jj > 0 && kk > 0) {
                            references[(ii - 1) + (jj - 1) * l + (kk - 1) * l * l] |= 0b1 << 6;
                        }
                        if (jj > 0 && kk > 0) {
                            references[ii + (jj - 1) * l + (kk - 1) * l * l] |= 0b1 << 7;
                        }
                    }
                }
            }
        }

        for (let k = - m; k < CHUNCK_LENGTH + m; k++) {
            for (let j = - m; j < CHUNCK_LENGTH + m; j++) {
                for (let i = - m; i < CHUNCK_LENGTH + m; i++) {
                    let ii = i + m;
                    let jj = j + m;
                    let kk = k + m;
                    let ref = references[ii + jj * l + kk * l * l];

                    if (isFinite(ref) && ref != 0 && ref != 0b11111111) {
                        let extendedpartVertexData = ChunckVertexData.Get(lod, ref);
                        if (extendedpartVertexData) {
                            let fastTriangles = extendedpartVertexData.fastTriangles;
                            let fastNormals = extendedpartVertexData.fastNormals;
                            let fastColorIndexes = extendedpartVertexData.fastColorIndex;
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

                                    let cx = fastColorIndexes[triIndex][vIndex].x;
                                    let cy = fastColorIndexes[triIndex][vIndex].y;
                                    let cz = fastColorIndexes[triIndex][vIndex].z;

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
                                    if (xIndex >= xMin && yIndex >= yMin && zIndex >= zMin && xIndex < xMax && yIndex < yMax && zIndex < zMax) {
                                        pIndex = ChunckMeshBuilder._GetVertex(xIndex, yIndex, zIndex);
                                        if (!isFinite(pIndex)) {
                                            pIndex = positions.length / 3;
                                            positions.push(x, y, z);
                                            let dataAtVertex = chunck.getRawData(i + cx + m, j + cz + m, k + cy + m);
                                            let color = BlockTypeColors[dataAtVertex];
                                            colors.push(color.r, color.g, color.b, 1);
                                            summedPositions.push(0, 0, 0);
                                            summedPositionsCount.push(0);
                                            normals.push(0, 0, 0);
                                            ChunckMeshBuilder._SetVertex(pIndex, xIndex, yIndex, zIndex)
                                        }

                                        if (xIndex === xMin || yIndex === yMin || zIndex === zMin || xIndex === (xMax - 1) || yIndex === (yMax - 1) || zIndex === (zMax - 1)) {
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

        if (positions.length === 0 || indices.length === 0) {
            return;
        }

        for (let i = 0; i < positions.length / 3; i++) {
            let factor = summedPositionsCount[i] / 3;
            positions[3 * i] = (summedPositions[3 * i] - factor * positions[3 * i]) / (summedPositionsCount[i] - factor);
            //positions[3 * i + 1] = (summedPositions[3 * i + 1] - factor * positions[3 * i + 1]) / (summedPositionsCount[i] - factor);
            positions[3 * i + 2] = (summedPositions[3 * i + 2] - factor * positions[3 * i + 2]) / (summedPositionsCount[i] - factor);
        }

        for (let i = 0; i < positions.length / 3; i++) {
            positions[3 * i] = (positions[3 * i] * chunck.levelFactor + 0.5) * BLOCK_SIZE_M;
            positions[3 * i + 1] = (positions[3 * i + 1] * chunck.levelFactor) * BLOCK_HEIGHT_M;
            positions[3 * i + 2] = (positions[3 * i + 2] * chunck.levelFactor + 0.5) * BLOCK_SIZE_M;
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
		vertexData.colors = colors;
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
                let x = i * levelCoef * BLOCK_SIZE_M;
                let y = 0;
                let z = j * levelCoef * BLOCK_SIZE_M;
                
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