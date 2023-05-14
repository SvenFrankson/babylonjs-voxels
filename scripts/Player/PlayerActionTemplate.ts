var ACTIVE_DEBUG_PLAYER_ACTION = true;

var ADD_BRICK_ANIMATION_DURATION = 1000;

class PlayerActionTemplate {

    public static async CreateBlockAction(player: Player, blockType: BlockType): Promise<PlayerAction> {
        let action = new PlayerAction(BlockTypeNames[blockType], player);
        let previewMesh: BABYLON.Mesh;
        action.iconUrl = "/datas/images/block-icon-" + BlockTypeNames[blockType] + "-miniature.png";

        let previewMeshData: BABYLON.VertexData = (await player.main.vertexDataLoader.get("chunck-part"))[0];
        let lastSize: number;
        let lastI: number;
        let lastJ: number;
        let lastK: number;

        let terrain = player.main.terrain;

        action.onUpdate = () => {
            if (!player.inputManager.inventoryOpened) {
                let hit = player.inputManager.getPickInfo(player.meshes);
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === BlockType.None ? - 0.75 : 0.75);
                    let localIJK = terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                    if (localIJK) {
                        // Redraw block preview
                        if (!previewMesh && blockType != BlockType.None) {
                            previewMesh = BABYLON.MeshBuilder.CreateBox("preview-mesh", { size: 1 }, player.scene);
                            let originY = BABYLON.MeshBuilder.CreateBox("originY", { width: 0.2, height: 100, depth: 0.2 });
                            originY.material = Main.greenMaterial;
                            originY.parent = previewMesh;
                            //previewMesh.material = terrain.getMaterial(0);
                            //previewMeshData.applyToMesh(previewMesh);
                        }
                        
                        previewMesh.position.copyFrom(localIJK.chunck.position);
                        previewMesh.position.addInPlace(new BABYLON.Vector3(
                            localIJK.ijk.i + 0.5,
                            localIJK.ijk.k,
                            localIJK.ijk.j + 0.5
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
                    let n =  hit.getNormal(true).scaleInPlace(blockType === BlockType.None ? - 0.75 : 0.75);
                    let localIJK = terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                    console.log(localIJK);
                    if (localIJK) {
                        localIJK.chunck.setData(blockType, localIJK.ijk.i, localIJK.ijk.j, localIJK.ijk.k);
                        localIJK.chunck.disposeMesh();
                        localIJK.chunck.redrawMesh();
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