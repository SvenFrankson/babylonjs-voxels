// Notice : Adding a BlockType
// 1) BlockType in the enum
// 2) BlockTypeNames in the list
// 3) Incrementing array size in terrainToon fragment shader
// 4) Initializing with a color in PlanetMaterial.ts 

var BlockTypeNames: string[] = [
    "None",
    "Water",
    "Grass",
    "Dirt",
    "Sand",
    "Rock",
    "Wood",
    "Leaf",
    "Laterite",
    "Basalt",
    "Snow",
    "Ice",
    "Regolith",
    "Unknown"
];

enum BlockType {
    None = 0,
    Water = 1,
    Grass,
    Dirt,
    Sand,
    Rock,
    Wood,
    Leaf,
    Laterite,
    Basalt,
    Snow,
    Ice,
    Regolith,
    Unknown
}

var BlockTypeColors: BABYLON.Color3[] = [];
BlockTypeColors[BlockType.None] = new BABYLON.Color3(1, 0, 0);
BlockTypeColors[BlockType.Water] = new BABYLON.Color3(0.0, 0.5, 1.0);
BlockTypeColors[BlockType.Grass] = new BABYLON.Color3(0.216, 0.616, 0.165);
BlockTypeColors[BlockType.Dirt] = new BABYLON.Color3(0.451, 0.263, 0.047);
BlockTypeColors[BlockType.Sand] = new BABYLON.Color3(0.761, 0.627, 0.141);
BlockTypeColors[BlockType.Rock] = new BABYLON.Color3(0.522, 0.522, 0.522);
BlockTypeColors[BlockType.Wood] = new BABYLON.Color3(0.600, 0.302, 0.020);
BlockTypeColors[BlockType.Leaf] = new BABYLON.Color3(0.431, 0.839, 0.020);
BlockTypeColors[BlockType.Laterite] = new BABYLON.Color3(0.839, 0.431, 0.020);
BlockTypeColors[BlockType.Basalt] = BABYLON.Color3.FromHexString("#1f1916");
BlockTypeColors[BlockType.Snow] = BABYLON.Color3.FromHexString("#efffff");
BlockTypeColors[BlockType.Ice] = BABYLON.Color3.FromHexString("#95e4f0");
BlockTypeColors[BlockType.Regolith] = new BABYLON.Color3(0.522, 0.522, 0.522);