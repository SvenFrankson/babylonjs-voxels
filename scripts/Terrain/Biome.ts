enum Biome {
    Cold,
    Forest,
    Desert
}

var BiomeAltFactor = [
    1,
    0.2,
    0.1
];

var BiomeColors = [
    BABYLON.Color3.FromInts(255, 255, 255),
    BABYLON.Color3.FromInts(57, 219, 48),
    BABYLON.Color3.FromInts(235, 192, 52),
];

var BIOME_COUNT = BiomeColors.length;

var PonderatedBiomes = [
    Biome.Cold,
    Biome.Cold,
    Biome.Cold,
    Biome.Forest,
    Biome.Desert,
    Biome.Desert,
    Biome.Desert
];

interface IBiomesValue {
    biomeA: Biome;
    f: number;
    biomeB: Biome;
}

class BiomeUtils {

    public static ValueToBiome(v: number): Biome {
        return PonderatedBiomes[Math.floor((v + 32768) / 65536 * PonderatedBiomes.length)];
    }

    public static ValueToBiomesToRef(v: number, biomes: IBiomesValue): void {
        let vFloat = (v + 32768) / 65536 * (PonderatedBiomes.length - 1);
        let vFloor = Math.floor(vFloat);
        biomes.f = 1 - (vFloat - vFloor);
        biomes.f = biomes.f * 2 - 0.5;
        biomes.f = Math.min(Math.max(biomes.f, 0), 1);
        biomes.f = Easing.easeInOutSine(biomes.f);
        biomes.biomeA = PonderatedBiomes[vFloor];
        biomes.biomeB = PonderatedBiomes[vFloor + 1];
    } 
}