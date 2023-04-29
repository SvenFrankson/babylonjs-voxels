class ExtendedVertexData {

    public trianglesData: number[] = [];
    public fastTriangles: BABYLON.Vector3[][] = [];
    public fastNormals: BABYLON.Vector3[] = [];

    private static SquaredLength(x: number, y: number, z: number): number {
        return x * x + y * y + z * z;
    }
    
    constructor(
        ref: number,
        public vertexData: BABYLON.VertexData
    ) {
        for (let i = 0; i < vertexData.indices.length / 3; i++) {
            let i1 = vertexData.indices[3 * i];
            let i2 = vertexData.indices[3 * i + 1];
            let i3 = vertexData.indices[3 * i + 2];

            let x1 = vertexData.positions[3 * i1];
            let y1 = vertexData.positions[3 * i1 + 1];
            let z1 = vertexData.positions[3 * i1 + 2];

            let x2 = vertexData.positions[3 * i2];
            let y2 = vertexData.positions[3 * i2 + 1];
            let z2 = vertexData.positions[3 * i2 + 2];

            let x3 = vertexData.positions[3 * i3];
            let y3 = vertexData.positions[3 * i3 + 1];
            let z3 = vertexData.positions[3 * i3 + 2];

            this.fastTriangles.push([
                new BABYLON.Vector3(Math.floor(x1 * 2), Math.floor(y1 * 2), Math.floor(z1 * 2)),
                new BABYLON.Vector3(Math.floor(x2 * 2), Math.floor(y2 * 2), Math.floor(z2 * 2)),
                new BABYLON.Vector3(Math.floor(x3 * 2), Math.floor(y3 * 2), Math.floor(z3 * 2))
            ]);

            let v1 = new BABYLON.Vector3(x1, y1, z1);
            let v2 = new BABYLON.Vector3(x2, y2, z2);
            let v3 = new BABYLON.Vector3(x3, y3, z3);
            let n = BABYLON.Vector3.Cross(v3.subtract(v1), v2.subtract(v1));
            n.normalize();
            let exists = false;
            for (let j = 0; j < this.fastNormals.length; j++) {
                let existingN = this.fastNormals[j];
                if (BABYLON.Vector3.Dot(existingN, n) > 0.99) {
                    exists = true;
                    break;
                }
            }
            if (exists) {
                this.fastNormals.push(BABYLON.Vector3.Zero());
            }
            else {
                this.fastNormals.push(n);
            }
        }
        let colors: number[] = [];
        let uvs: number[] = [];

        let d0 = ref & (0b1 << 0);
        let d1 = ref & (0b1 << 1);
        let d2 = ref & (0b1 << 2);
        let d3 = ref & (0b1 << 3);
        let d4 = ref & (0b1 << 4);
        let d5 = ref & (0b1 << 5);
        let d6 = ref & (0b1 << 6);
        let d7 = ref & (0b1 << 7);

        for (let n = 0; n < this.vertexData.indices.length / 3; n++) {
            let n1 = this.vertexData.indices[3 * n];
            let n2 = this.vertexData.indices[3 * n + 1];
            let n3 = this.vertexData.indices[3 * n + 2];

            let x0 = this.vertexData.positions[3 * n1];
            let y0 = this.vertexData.positions[3 * n1 + 1] - this.vertexData.normals[3 * n1 + 1] * 0.2;
            let z0 = this.vertexData.positions[3 * n1 + 2];

            let x1 = this.vertexData.positions[3 * n2];
            let y1 = this.vertexData.positions[3 * n2 + 1] - this.vertexData.normals[3 * n2 + 1] * 0.2;
            let z1 = this.vertexData.positions[3 * n2 + 2];

            let x2 = this.vertexData.positions[3 * n3];
            let y2 = this.vertexData.positions[3 * n3 + 1] - this.vertexData.normals[3 * n3 + 1] * 0.2;
            let z2 = this.vertexData.positions[3 * n3 + 2];

            let bx = (x0 + x1 + x2) / 3;
            let by = (y0 + y1 + y2) / 3;
            let bz = (z0 + z1 + z2) / 3;

            let minDistance = Infinity;
            if (d0) {
                let distance = ExtendedVertexData.SquaredLength(bx, by, bz);
                if (distance < minDistance) {
                    this.trianglesData[n] = 0;
                    minDistance = distance;
                }
            }
            if (d1) {
                let distance = ExtendedVertexData.SquaredLength((1 - bx), by, bz);
                if (distance < minDistance) {
                    this.trianglesData[n] = 1;
                    minDistance = distance;
                }
            }
            if (d2) {
                let distance = ExtendedVertexData.SquaredLength((1 - bx), by, (1 - bz));
                if (distance < minDistance) {
                    this.trianglesData[n] = 2;
                    minDistance = distance;
                }
            }
            if (d3) {
                let distance = ExtendedVertexData.SquaredLength(bx, by, (1 - bz));
                if (distance < minDistance) {
                    this.trianglesData[n] = 3;
                    minDistance = distance;
                }
            }
            if (d4) {
                let distance = ExtendedVertexData.SquaredLength(bx, (1 - by), bz);
                if (distance < minDistance) {
                    this.trianglesData[n] = 4;
                    minDistance = distance;
                }
            }
            if (d5) {
                let distance = ExtendedVertexData.SquaredLength((1 - bx), (1 - by), bz);
                if (distance < minDistance) {
                    this.trianglesData[n] = 5;
                    minDistance = distance;
                }
            }
            if (d6) {
                let distance = ExtendedVertexData.SquaredLength((1 - bx), (1 - by), (1 - bz));
                if (distance < minDistance) {
                    this.trianglesData[n] = 6;
                    minDistance = distance;
                }
            }
            if (d7) {
                let distance = ExtendedVertexData.SquaredLength(bx, (1 - by), (1 - bz));
                if (distance < minDistance) {
                    this.trianglesData[n] = 7;
                    minDistance = distance;
                }
            }
            
            colors[4 * n1] = 1;
            colors[4 * n1 + 1] = 1;
            colors[4 * n1 + 2] = 1;
            colors[4 * n1 + 3] = 1;

            colors[4 * n2] = 1;
            colors[4 * n2 + 1] = 1;
            colors[4 * n2 + 2] = 1;
            colors[4 * n2 + 3] = 1;

            colors[4 * n3] = 1;
            colors[4 * n3 + 1] = 1;
            colors[4 * n3 + 2] = 1;
            colors[4 * n3 + 3] = 1;

            uvs[2 * n1] = 1;
            uvs[2 * n1 + 1] = 1;
            uvs[2 * n2] = 1;
            uvs[2 * n2 + 1] = 1;
            uvs[2 * n3] = 1;
            uvs[2 * n3 + 1] = 1;
        }

        this.vertexData.colors = colors;
        this.vertexData.uvs = uvs;
    }
}