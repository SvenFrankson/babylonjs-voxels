abstract class GeneratorElement {
    public aabbMin: BABYLON.Vector3 = new BABYLON.Vector3(Infinity, Infinity, Infinity);
    public aabbMax: BABYLON.Vector3 = new BABYLON.Vector3(- Infinity, - Infinity, - Infinity);
    
    public abstract getData(ijkGlobal: IJK): BlockType;
}