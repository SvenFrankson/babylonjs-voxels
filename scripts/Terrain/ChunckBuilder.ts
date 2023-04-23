class ChunckMeshBuilder {

    public static BuildVertexData(chunck: Chunck): BABYLON.VertexData {
        let vertexData = new BABYLON.VertexData();
        let positions: number[] = [];
        let indices: number[] = [];
        let normals: number[] = [];

        let levelCoef = chunck.levelFactor;
        let vertexCount = CHUNCK_LENGTH + 1;

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