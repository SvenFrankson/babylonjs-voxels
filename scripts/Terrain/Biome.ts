enum Biome {
    Cold,
    Forest,
    Desert
}

var BiomeColors = [
    BABYLON.Color3.FromInts(255, 255, 255),
    BABYLON.Color3.FromInts(57, 219, 48),
    BABYLON.Color3.FromInts(235, 192, 52),
];

var BIOME_COUNT = BiomeColors.length;

var PonderatedBiomes = [
    Biome.Cold,
    Biome.Cold,
    Biome.Forest,
    Biome.Desert,
    Biome.Desert
];

class BiomeUtils {

    public static ValueToBiome(v: number): Biome {
        return PonderatedBiomes[Math.floor((v + 32768) / 65536 * PonderatedBiomes.length)];
    }
}