interface IJK {
    i: number;
    j: number;
    k: number;
}

function IJKSqrDist(ijk1: IJK, ijk2: IJK): number {
    let di = ijk2.i - ijk1.i;
    let dj = ijk2.j - ijk1.j;
    let dk = ijk2.k - ijk1.k;
    
    return di * di + dj * dj + dk * dk;
}