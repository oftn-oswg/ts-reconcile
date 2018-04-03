export default class IBF {

    size: number;
    keysize: number;
    hashset: Uint32Array;
    counts: Int32Array;
    data: Uint8Array;

    constructor(size: number, keysize: number) {
        if (size < 1) {
            size = 1;
        }
        if (keysize < 1) {
            keysize = 1;
        }

        this.size = size;
        this.keysize = size;
        this.hashset = new Uint32Array(size);
        this.counts = new Int32Array(size);
        this.data = new Uint8Array(keysize * size);
    }

    hashes(key: Uint8Array): number[] {

    }
}
