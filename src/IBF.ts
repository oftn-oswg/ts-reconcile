import { Sum128 } from "./Murmur3";

export interface IBFDeduction {
    local: Uint8Array[];
    remote: Uint8Array[];
    complete: boolean;
}

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
        this.keysize = keysize;
        this.hashset = new Uint32Array(size);
        this.counts = new Int32Array(size);
        this.data = new Uint8Array(keysize * size);
    }

    hashes(key: Uint8Array): number[] {
        const hashes = Sum128(key);
        return [
            hashes[0],
            hashes[1],
            hashes[2],
            hashes[3]
        ]
    }

    indices(hashes: number[]): number[] {
        return hashes.map((value: number): number => {
            return value % this.size;
        });
    }

    update(key: Uint8Array, hash: number, indices: number[], increment: number): void {
        if (key.byteLength != this.keysize) {
            throw new RangeError(
                `Update key of size ${key.byteLength} ` +
                `to filter with key size of ${this.keysize}`);
        }

        for (let cellref = 0; cellref < indices.length; cellref++) {
            const cell = indices[cellref];
            const datastart = cell * this.keysize;
            for (let j = 0; j < this.keysize; j++) {
                this.data[datastart + j] ^= key[j];
            }
            this.hashset[cell] ^= hash;
            this.counts[cell] += increment;
        }
    }

    add(key: Uint8Array): void {
        const hashes = this.hashes(key);
        const indices = this.indices(hashes.slice(1));
        this.update(key, hashes[0], indices, 1);
    }

    remove(key: Uint8Array): void {
        const hashes = this.hashes(key);
        const indices = this.indices(hashes.slice(1));
        this.update(key, hashes[0], indices, -1);
    }

    subtract(subtrahend: IBF): void {
        const size = this.size;
        const keysize = this.keysize;

        if (size != subtrahend.size ||
            keysize != subtrahend.keysize) {
            throw new RangeError(
                `Subtracting filters with different sizes: ` +
                `(${size}, ${keysize}) and (${subtrahend.size}, ${subtrahend.keysize})`)
        }

        const datasize = keysize * size;
        for (let i = 0; i < datasize; i++) {
            this.data[i] ^= subtrahend.data[i];
        }

        for (let i = 0; i < size; i++) {
            this.hashset[i] ^= subtrahend.hashset[i];
            this.counts[i] -= subtrahend.counts[i];
        }
    }

    count(cell: number): number {
        return this.counts[cell];
    }

    keysum(cell: number): Uint8Array {
        const keysize = this.keysize;
        const start = cell * keysize;
        const end = start + keysize;
        return this.data.slice(start, end);
    }

    hashsum(cell: number): number {
        return this.hashset[cell];
    }

    pure(cell: number): boolean {
        const count = this.counts[cell];
        if (count !== 1 && count !== -1) {
            return false;
        }
        const keysize = this.keysize;
        const buffer = this.data.buffer;
        const offset = cell * keysize;
        const length = keysize;

        const hashes = this.hashes(new Uint8Array(buffer, offset, length));
        return hashes[0] === this.hashset[cell];
    }

    decode(): IBFDeduction {
        const purelist: number[] = [];
        const deduction: IBFDeduction = {
            local: [],
            remote: [],
            complete: false
        };

        // Get the initial list of pure cells
        const size = this.size;
        for (let i = 0; i < size; i++) {
            if (this.pure(i)) {
                purelist.push(i);
            }
        }

        // Main decoding loop
        // Run while we have pure cells we can use to decode
        while (purelist.length) {
            // Get one of the pure cell indices and dequeue
            const index = purelist.pop();

            if (!this.pure(index)) {
                continue;
            }

            const key = this.keysum(index);
            const count = this.counts[index];
            const hashes = this.hashes(key);
            const indices = this.indices(hashes.slice(1));

            // Use the value of count to determine which difference we are part of
            if (count > 0) {
                deduction.local.push(key);
            } else {
                deduction.remote.push(key);
            }

            // Remove this cell to uncover new pure cells
            this.update(key, hashes[0], indices, -count);
            for (let i = 0; i < indices.length; i++) {
                const index = indices[i];
                if (this.pure(index)) {
                    purelist.push(index);
                }
            }
        }

        // Check for failure; we need an empty filter after decoding
        for (let i = 0; i < size; i++) {
            if (this.hashset[i] != 0 || this.counts[i] != 0) {
                return deduction;
            }
        }
        const datasize = this.data.byteLength;
        for (let i = 0; i < datasize; i++) {
            if (this.data[i] !== 0) {
                return deduction;
            }
        }

        deduction.complete = true;
        return deduction;
    }
}
