function rotateleft32(num: number, amt: number): number {
    return (num << amt) | (num >>> (32 - amt));
}


/**
 * Sum128 calculates the Murmur3 128-bit hash for 32-bit platforms.
 * @param data The data to hash
 * @param seed The seed
 */
export function Sum128(data: ArrayBuffer, seed: number): Uint32Array {
    const c1 = 0x239b961b; 
    const c2 = 0xab0e9789;
    const c3 = 0x38b34ae5; 
    const c4 = 0xa1e38b93;

    const len = data.byteLength;
    const blocks = len / 16 | 0;
    const blockarray = new Uint32Array(data, 0, blocks);

    let h1 = 0;
    let h2 = 0;
    let h3 = 0;
    let h4 = 0;

    // Digest
    for (let i = -blocks; i; i++) {
        let k1 = blockarray[i*4 + 0];
        let k2 = blockarray[i*4 + 1];
        let k3 = blockarray[i*4 + 2];
        let k4 = blockarray[i*4 + 3];

        k1 = (k1 * c1) >>> 0;
        k1 = rotateleft32(k1, 15);
        k1 = (k1 * c2) >>> 0;
        h1 ^= k1;

        h1 = rotateleft32(h1, 19);
        h1 = (h1 + h2) >>> 0;
        h1 = (h1*5 + 0x561ccd1b) >>> 0;

        k2 = (k2 * c2) >>> 0;
        k2 = rotateleft32(k2, 16);
        k2 *= c3;
        h2 ^= k2;
    
        h2 = rotateleft32(h2, 17);
        h2 += h3;
        h2 = h2*5 + 0x0bcaa747;
    
        k3 *= c3;
        k3  = rotateleft32(k3, 17);
        k3 *= c4;
        h3 ^= k3;
    
        h3 = rotateleft32(h3, 15);
        h3 += h4;
        h3 = h3*5 + 0x96cd1c35;
    
        k4 *= c4;
        k4 = rotateleft32(k4, 18);
        k4 *= c1;
        h4 ^= k4;
    
        h4 = rotateleft32(h4, 13);
        h4 += h1;
        h4 = h4*5 + 0x32ac3b17;
    }

    // Finalization
}
