class VPickInfo {

    public hit: boolean = false;
    public localPoint: BABYLON.Vector3;
    public worldPoint: BABYLON.Vector3;
    public worldNormal: BABYLON.Vector3;
    public distance: number;
}

class VCollision {

    private static _Tmp0: BABYLON.Vector3 = BABYLON.Vector3.One();
    public static MedianNormalOnMeshes(worldPoint: BABYLON.Vector3, meshes: BABYLON.Mesh[], searchDist: number, ignoreOpposedTo?: BABYLON.Vector3): BABYLON.Vector3 {
        let worldNormal = BABYLON.Vector3.Up();

        let sqrSearchDist = searchDist * searchDist;

        for (let j = 0; j < meshes.length; j++) {
            let mesh = meshes[j];
            if (mesh) {
                let localPoint = BABYLON.Vector3.TransformCoordinates(worldPoint, mesh.getWorldMatrix().clone().invert());
                let localIgnoreOpposedTo: BABYLON.Vector3;
                if (ignoreOpposedTo) {
                    localIgnoreOpposedTo = BABYLON.Vector3.TransformNormal(ignoreOpposedTo, mesh.getWorldMatrix().clone().invert());
                }
            
                let positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                let normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    
                if (positions && normals) {
                    for (let i = 0; i < positions.length / 3; i++) {
                        let dx = localPoint.x - positions[3 * i];
                        let dy = localPoint.y - positions[3 * i + 1];
                        let dz = localPoint.z - positions[3 * i + 2];
            
                        let sqrDist = dx * dx + dy * dy + dz * dz;
                        if (sqrDist < sqrSearchDist) {
                            let nx = normals[3 * i];
                            let ny = normals[3 * i + 1];
                            let nz = normals[3 * i + 2];

                            if (!localIgnoreOpposedTo || nx * localIgnoreOpposedTo.x + ny * localIgnoreOpposedTo.y + nz * localIgnoreOpposedTo.z > 0) {
                                let dist = Math.sqrt(sqrDist);
            
                                VCollision._Tmp0.copyFromFloats(nx, ny, nz);
                                BABYLON.Vector3.TransformNormalToRef(VCollision._Tmp0, mesh.getWorldMatrix(), VCollision._Tmp0);
                                VCollision._Tmp0.scaleInPlace(dist);
            
                                worldNormal.x += VCollision._Tmp0.x;
                                worldNormal.y += VCollision._Tmp0.y;
                                worldNormal.z += VCollision._Tmp0.z;
                            }
                        }
                    }
                }
            }
        }

        worldNormal.normalize();

        return worldNormal;
    }

    public static ClosestPointOnMesh(worldPoint: BABYLON.Vector3, mesh: BABYLON.Mesh, ignoreOpposedTo?: BABYLON.Vector3): VPickInfo {
        let pickInfo = new VPickInfo();

        let localPoint = BABYLON.Vector3.TransformCoordinates(worldPoint, mesh.getWorldMatrix().clone().invert());
        let localIgnoreOpposedTo: BABYLON.Vector3;
        if (ignoreOpposedTo) {
            localIgnoreOpposedTo = BABYLON.Vector3.TransformNormal(ignoreOpposedTo, mesh.getWorldMatrix().clone().invert());
        }

        let minIndex = -1;
        let minSqrDist = Infinity;
        let positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (positions) {
            for (let i = 0; i < positions.length / 3; i++) {
                let dx = localPoint.x - positions[3 * i];
                let dy = localPoint.y - positions[3 * i + 1];
                let dz = localPoint.z - positions[3 * i + 2];
    
                let sqrDist = dx * dx + dy * dy + dz * dz;
                if (sqrDist < minSqrDist) {
                    minIndex = i;
                    minSqrDist = sqrDist;
                }
            }
        }

        let triangles: number[] = [];
        let indices = mesh.getIndices();
        if (indices) {
            for (let i = 0; i < indices.length / 3; i++) {
                let i1 = indices[3 * i];
                let i2 = indices[3 * i + 1];
                let i3 = indices[3 * i + 2];
    
                if (i1 === minIndex || i2 === minIndex || i3 === minIndex) {
                    triangles.push(i1, i2, i3);
                }
            }
        }

        let minDist = Infinity;

        for (let i = 0; i < triangles.length / 3; i++) {
            let i1 = triangles[3 * i];
            let i2 = triangles[3 * i + 1];
            let i3 = triangles[3 * i + 2];
            
            let p1 = new BABYLON.Vector3(positions[3 * i1], positions[3 * i1 + 1], positions[3 * i1 + 2]);
            let p2 = new BABYLON.Vector3(positions[3 * i2], positions[3 * i2 + 1], positions[3 * i2 + 2]);
            let p3 = new BABYLON.Vector3(positions[3 * i3], positions[3 * i3 + 1], positions[3 * i3 + 2]);

            let v12 = p2.subtract(p1);
            let v23 = p3.subtract(p2);
            let v31 = p1.subtract(p3);

            let n = BABYLON.Vector3.Cross(p1.subtract(p2), p3.subtract(p2)).normalize();
            if (!localIgnoreOpposedTo || n.x * localIgnoreOpposedTo.x + n.y * localIgnoreOpposedTo.y + n.z * localIgnoreOpposedTo.z > - Math.SQRT2 * 0.5) {
                let p1p = localPoint.subtract(p1);
                let dot = BABYLON.Vector3.Dot(p1p, n);

                let projectedPoint = localPoint.subtract(n.scale(dot));
                let projected = false;

                // check
                // edge 12
                let n12 = BABYLON.Vector3.Cross(v12, n);
                let v1 = projectedPoint.subtract(p1);
                if (!projected && BABYLON.Vector3.Dot(v1, n12) <= 0) {
                    let l = BABYLON.Vector3.Distance(p1, p2);
                    v12.scaleInPlace(1 / l);
                    let d = BABYLON.Vector3.Dot(v1, v12);
                    projectedPoint.copyFrom(v12).scaleInPlace(d).addInPlace(p1);
                    v1.copyFrom(projectedPoint).subtractInPlace(p1);
                    d = BABYLON.Vector3.Dot(v1, v12);
                    if (d < 0) {
                        projectedPoint.copyFrom(p1);
                    }
                    else if (d > l) {
                        projectedPoint.copyFrom(p2);
                    }
                    projected = true;
                }

                let n23 = BABYLON.Vector3.Cross(v23, n);
                let v2 = projectedPoint.subtract(p2);
                if (!projected && BABYLON.Vector3.Dot(v2, n23) <= 0) {
                    let l = BABYLON.Vector3.Distance(p2, p3);
                    v23.scaleInPlace(1 / l);
                    let d = BABYLON.Vector3.Dot(v2, v23);
                    projectedPoint.copyFrom(v23).scaleInPlace(d).addInPlace(p2);
                    v2.copyFrom(projectedPoint).subtractInPlace(p2);
                    d = BABYLON.Vector3.Dot(v2, v23);
                    if (d < 0) {
                        projectedPoint.copyFrom(p2);
                    }
                    else if (d > l) {
                        projectedPoint.copyFrom(p3);
                    }
                    projected = true;
                }
                
                let n31 = BABYLON.Vector3.Cross(v31, n);
                let v3 = projectedPoint.subtract(p3);
                if (!projected && BABYLON.Vector3.Dot(v3, n31) <= 0) {
                    let l = BABYLON.Vector3.Distance(p3, p1);
                    v31.scaleInPlace(1 / l);
                    let d = BABYLON.Vector3.Dot(v3, v31);
                    projectedPoint.copyFrom(v31).scaleInPlace(d).addInPlace(p3);
                    v3.copyFrom(projectedPoint).subtractInPlace(p3);
                    d = BABYLON.Vector3.Dot(v3, v31);
                    if (d < 0) {
                        projectedPoint.copyFrom(p3);
                    }
                    else if (d > l) {
                        projectedPoint.copyFrom(p1);
                    }
                    projected = true;
                }

                let dist = BABYLON.Vector3.Distance(projectedPoint, localPoint);
                if (dist < minDist) {
                    minDist = dist;
                    let worldProjected = BABYLON.Vector3.TransformCoordinates(projectedPoint, mesh.getWorldMatrix());
                    let worldN = BABYLON.Vector3.TransformNormal(n, mesh.getWorldMatrix());
                    pickInfo.worldPoint = worldProjected;
                    pickInfo.worldNormal = worldN;
                    pickInfo.distance = dist;
                    pickInfo.hit = true;
                }
            }
        }

        return pickInfo;
    }
}