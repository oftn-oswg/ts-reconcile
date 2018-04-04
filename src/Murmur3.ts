function rotateleft32(num: number, amt: number): number {
    return (num << amt) | (num >>> (32 - amt));
}
function mul32(a: number, b: number) {
    const a0 = a & 0xffff;
    const b0 = b & 0xffff;
    return ((a >>> 16) * b0 + a0 * (b >>> 16) << 16) + (a0 * b0) >>> 0;
}
function finalizationMix32(h: number): number {
    h ^= h >>> 16;
    h = mul32(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = mul32(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h;
}


/**
 * Sum128 calculates the Murmur3 128-bit hash for 32-bit platforms.
 * @param data The data to hash
 */
export function Sum128(data: Uint8Array): Uint32Array {
    let k1 = 0, k2 = 0, k3 = 0, k4 = 0;
    let h1 = 0, h2 = 0, h3 = 0, h4 = 0;

    const c1 = 0x239b961b, c2 = 0xab0e9789, c3 = 0x38b34ae5, c4 = 0xa1e38b93;

    const buffer = data.buffer;
    const offset = data.byteOffset;
    const len = data.byteLength;

    const blocks = len / 16 | 0;
    const head = new Uint32Array(buffer, offset, blocks * 4);
    const tail = new Uint8Array(buffer, offset + blocks * 16);

    // Head

    for (let i = 0; i < blocks; i++) {
        let k1 = head[i * 4 + 0];
        let k2 = head[i * 4 + 1];
        let k3 = head[i * 4 + 2];
        let k4 = head[i * 4 + 3];

        k1 = mul32(k1, c1);
        k1 = rotateleft32(k1, 15);
        k1 = mul32(k1, c2);
        h1 ^= k1;

        h1 = rotateleft32(h1, 19);
        h1 = h1 + h2 >>> 0;
        h1 = h1 * 5 + 0x561ccd1b >>> 0;

        k2 = mul32(k2, c2);
        k2 = rotateleft32(k2, 16);
        k2 = mul32(k2, c3);
        h2 ^= k2;

        h2 = rotateleft32(h2, 17);
        h2 = h2 + h3 >>> 0;
        h2 = h2 * 5 + 0x0bcaa747 >>> 0;

        k3 = mul32(k3, c3);
        k3 = rotateleft32(k3, 17);
        k3 = mul32(k3, c4);
        h3 ^= k3;

        h3 = rotateleft32(h3, 15);
        h3 = h3 + h4 >>> 0;
        h3 = h3 * 5 + 0x96cd1c35 >>> 0;

        k4 = mul32(k4, c4);
        k4 = rotateleft32(k4, 18);
        k4 = mul32(k4, c1);
        h4 ^= k4;

        h4 = rotateleft32(h4, 13);
        h4 = h4 + h1 >>> 0;
        h4 = h4 * 5 + 0x32ac3b17 >>> 0;
    }

    // Tail

    switch (len & 0xf) {
        case 0xf: k4 ^= tail[14] << 16;
        case 0xe: k4 ^= tail[13] << 8;
        case 0xd:
            k4 ^= tail[12];
            k4 = mul32(k4, c4);
            k4 = rotateleft32(k4, 18);
            k4 = mul32(k4, c1);
            h4 ^= k4;

        case 0xc: k3 ^= tail[11] << 24;
        case 0xb: k3 ^= tail[10] << 16;
        case 0xa: k3 ^= tail[9] << 8;
        case 0x9:
            k3 ^= tail[8];
            k3 = mul32(k3, c3);
            k3 = rotateleft32(k3, 17);
            k3 = mul32(k3, c4);
            h3 ^= k3;

        case 0x8: k2 ^= tail[7] << 24;
        case 0x7: k2 ^= tail[6] << 16;
        case 0x6: k2 ^= tail[5] << 8;
        case 0x5: k2 ^= tail[4] << 0;
            k2 = mul32(k2, c2);
            k2 = rotateleft32(k2, 16);
            k2 = mul32(k2, c3);
            h2 ^= k2;

        case 0x4: k1 ^= tail[3] << 24;
        case 0x3: k1 ^= tail[2] << 16;
        case 0x2: k1 ^= tail[1] << 8;
        case 0x1: k1 ^= tail[0] << 0;
            k1 = mul32(k1, c1);
            k1 = rotateleft32(k1, 15);
            k1 = mul32(k1, c2);
            h1 ^= k1;
    }

    h1 ^= len;
    h2 ^= len;
    h3 ^= len;
    h4 ^= len;

    h1 = h1 + h2 >>> 0;
    h1 = h1 + h3 >>> 0;
    h1 = h1 + h4 >>> 0;
    h2 = h2 + h1 >>> 0;
    h3 = h3 + h1 >>> 0;
    h4 = h4 + h1 >>> 0;

    h1 = finalizationMix32(h1);
    h2 = finalizationMix32(h2);
    h3 = finalizationMix32(h3);
    h4 = finalizationMix32(h4);
    
    h1 = h1 + h2 >>> 0;
    h1 = h1 + h3 >>> 0;
    h1 = h1 + h4 >>> 0;
    h2 = h2 + h1 >>> 0;
    h3 = h3 + h1 >>> 0;
    h4 = h4 + h1 >>> 0;

    return new Uint32Array([h1, h2, h3, h4]);
}
