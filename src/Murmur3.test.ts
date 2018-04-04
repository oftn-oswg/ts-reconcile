import * as mocha from 'mocha';
import * as chai from 'chai';

import { Sum128 } from './Murmur3';

const expect = chai.expect;

function makeASCIIBuffer(str: string): Uint8Array {
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        arr[i] = str.charCodeAt(i);
    }
    return arr;
}

describe('Murmur3 128-bit Hash', () => {
    it('should match with one block', () => {
        const out = Sum128(makeASCIIBuffer('This is 16 bytes'));
        expect(out).to.deep.equal(new Uint32Array([0xd42f6b0a, 0x9a95f367, 0xdcd64279, 0x98f8e6d5]));
    });

    it('should match with two blocks', () => {
        const out = Sum128(makeASCIIBuffer("This is 32 bytes 'cuz we need it"));
        expect(out).to.deep.equal(new Uint32Array([0x63ea548f, 0x4c2ed36e, 0xba490a09, 0xedbb8a10]));
    });

    it ('should match with a tail of 15 bytes', () => {
        const out = Sum128(makeASCIIBuffer("This is 47 bytes so we can have a 15-byte tail."));
        expect(out).to.deep.equal(new Uint32Array([0x373e6102, 0x3309e580, 0x5babab6c, 0x35d0b798]));
    });
})
