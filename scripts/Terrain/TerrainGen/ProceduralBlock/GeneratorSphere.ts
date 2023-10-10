class GeneratorSphere extends GeneratorElement {

    constructor(
        public blockType: BlockType,
        public center: IJK,
        public radius: number
    ) {
        super();
    }

    public getData(ijkGlobal: IJK): BlockType {
        let sqrDist = IJKSqrDist(this.center, ijkGlobal);
        if (sqrDist < this.radius * this.radius) {
            return this.blockType;
        }
        return BlockType.Unknown;
    }
}