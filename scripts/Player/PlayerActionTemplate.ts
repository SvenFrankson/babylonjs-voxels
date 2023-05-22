var ACTIVE_DEBUG_PLAYER_ACTION = true;

var ADD_BRICK_ANIMATION_DURATION = 1000;

class PlayerActionTemplate {

    public static async CreateBlockAction(player: Player, blockType: BlockType): Promise<PlayerAction> {
        let action = new PlayerAction(BlockTypeNames[blockType], player);
        let previewMesh: BABYLON.Mesh;
        action.iconUrl = "/datas/images/block-icon-" + BlockTypeNames[blockType] + "-miniature.png";

        let previewMeshData: BABYLON.VertexData = (await player.main.vertexDataLoader.get("chunck-part"))[0];
        let color = BlockTypeColors[blockType];
        let colors: number[] = [];
        for (let i = 0; i < previewMeshData.positions.length / 3; i++) {
            colors.push(color.r, color.g, color.b, 1);
        }
        previewMeshData = VertexDataLoader.clone(previewMeshData);
        previewMeshData.colors = colors;

        let size = 1;
        let radius = Math.floor(size / 2);

        let lastSize: number;
        let lastI: number;
        let lastJ: number;
        let lastK: number;

        let terrain = player.main.terrain;

        action.onUpdate = () => {
            if (!player.inputManager.inventoryOpened) {
                let hit = player.inputManager.getPickInfo(player.meshes);
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === BlockType.None ? - 0.3 : 0.3);
                    let localIJK = terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                    if (localIJK) {
                        // Redraw block preview
                        if (!previewMesh) {
                            previewMesh = new BABYLON.Mesh("preview-mesh", player.scene);
                            previewMesh.material = terrain.getMaterial(0);
                            previewMeshData.applyToMesh(previewMesh);
                            previewMesh.scaling.copyFromFloats(size * BLOCK_SIZE_M, size * BLOCK_HEIGHT_M, size * BLOCK_SIZE_M);
                        }
                        
                        previewMesh.position.copyFrom(localIJK.chunck.position);
                        previewMesh.position.addInPlace(new BABYLON.Vector3(
                            (localIJK.ijk.i + 0.5) * BLOCK_SIZE_M,
                            (localIJK.ijk.k) * BLOCK_HEIGHT_M,
                            (localIJK.ijk.j + 0.5) * BLOCK_SIZE_M
                        ));

                        return;
                    }
                }
            }
            
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
        }

        action.onClick = () => {
            if (!player.inputManager.inventoryOpened) {
                let hit = player.inputManager.getPickInfo(player.meshes);
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === BlockType.None ? - 0.65 : 0.65);
                    let localIJK = terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                    if (localIJK) {
                        let totalAffectedChuncks = new UniqueList<Chunck>();
                        for (let I = - radius; I <= radius; I++) {
                            for (let J = - radius; J <= radius; J++) {
                                for (let K = - radius; K <= radius; K++) {
                                    let affectedChuncks = localIJK.chunck.setData(blockType, localIJK.ijk.i + I, localIJK.ijk.j + J, localIJK.ijk.k + K);
                                    affectedChuncks.forEach(c => {
                                        totalAffectedChuncks.push(c);
                                    });
                                }
                            }
                        }
                        totalAffectedChuncks.forEach(affectedChunck => {
                            affectedChunck.disposeMesh();
                            affectedChunck.redrawMesh();
                        });
                    }
                }
            }
        }

        action.onUnequip = () => {
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
            lastSize = undefined;
            lastI = undefined;
            lastJ = undefined;
            lastK = undefined;
        }
        
        return action;
    }
}