var ACTIVE_DEBUG_PLAYER_ACTION = true;

var ADD_BRICK_ANIMATION_DURATION = 1000;

class PlayerActionTemplate {

    public static async CreateBlockAction(player: Player, blockType: BlockType): Promise<PlayerAction> {
        let action = new PlayerAction(BlockTypeNames[blockType], player);
        let previewMesh: BABYLON.Mesh;
        let previewBox: BABYLON.Mesh;
        action.iconUrl = "/datas/images/block-icon-" + BlockTypeNames[blockType] + "-miniature.png";

        let previewMeshData: BABYLON.VertexData = (await player.main.vertexDataLoader.get("chunck-part"))[0];
        let previewBoxData: BABYLON.VertexData = (await player.main.vertexDataLoader.get("chunck-part"))[1];
        let lastSize: number;
        let lastI: number;
        let lastJ: number;
        let lastK: number;

        let terrain = player.main.terrain;

        action.onUpdate = () => {
            if (!player.inputManager.inventoryOpened) {
                let hit = player.inputManager.getPickInfo(player.meshes);
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === BlockType.None ? - 0.2 : 0.2);
                    let localIJK = terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                    if (localIJK) {
                        // Redraw block preview
                        if (!previewMesh && blockType != BlockType.None) {
                            previewMesh = new BABYLON.Mesh("preview-mesh");
                            previewMesh.material = terrain.getMaterial(0);
                        }
                        if (!previewBox) {
                            previewBox = new BABYLON.Mesh("preview-box");
                            if (blockType === BlockType.None) {
                                //previewBox.material = SharedMaterials.RedEmissiveMaterial();
                            }
                            else {
                                //previewBox.material = SharedMaterials.WhiteEmissiveMaterial();
                            }
                            previewBox.layerMask = 0x1;
                        }
                        previewBox.position.copyFrom(localIJK.chunck.position);
                        previewBox.position.addInPlace(localIJK.ijk);

                        return;
                    }
                }
            }
            
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
            if (previewBox) {
                previewBox.dispose();
                previewBox = undefined;
            }
        }

        action.onClick = () => {
            if (!player.inputManager.inventoryOpened) {
                let hit = player.inputManager.getPickInfo(player.meshes);
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === BlockType.None ? - 0.2 : 0.2);
                    let localIJK = terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                    if (localIJK) {
                        localIJK.chunck.setData(blockType, localIJK.ijk.x, localIJK.ijk.y, localIJK.ijk.z);
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
            if (previewBox) {
                previewBox.dispose();
                previewBox = undefined;
            }
            lastSize = undefined;
            lastI = undefined;
            lastJ = undefined;
            lastK = undefined;
        }
        
        return action;
    }
}