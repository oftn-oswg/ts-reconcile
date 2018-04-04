import * as mocha from 'mocha';
import * as chai from 'chai';

import IBF from './IBF';

const expect = chai.expect;

function makeRandomElements(count: number, keysize: number): Uint8Array[] {
    const elements: Uint8Array[] = [];
    while (count--) {
        const element = new Uint8Array(keysize);
        for (let i = 0; i < keysize; i++) {
            element[i] = Math.random() * 0xff;
        }
        elements.push(element);
    }
    return elements;
}

function elementsEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    for (let i = 0; i < a.byteLength; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

function containsElement(list: Uint8Array[], element: Uint8Array): boolean {
    const keysize = element.byteLength;
    for (let i = 0; i < list.length; i++) {
        if (elementsEqual(list[i], element)) {
            return true;
        }
    }
    return false;
}

describe('Invertible Bloom Filter', () => {
    for (let base = 1; base <= 9; base += 4) {
        for (let diffs = 1; diffs <= 8; diffs++) {

            it(`should decode with ${base} similarities and ${diffs} differences`, () => {

                const cells = 2 + diffs * 4;
                const keysize = 32;

                // Prepare elements
                const common = makeRandomElements(base, keysize);
                const elementsAunique: Uint8Array[] = [];
                const elementsBunique: Uint8Array[] = [];
                makeRandomElements(diffs, keysize).forEach((element: Uint8Array) => {
                    [elementsAunique, elementsBunique][+(Math.random() < 0.5)].push(element);
                });
                const elementsA = common.concat(elementsAunique);
                const elementsB = common.concat(elementsBunique);

                // Construct filters
                const filterA = new IBF(cells, keysize);
                const filterB = new IBF(cells, keysize);
                elementsA.forEach((element: Uint8Array) => {
                    filterA.add(element);
                });
                elementsB.forEach((element: Uint8Array) => {
                    filterB.add(element);
                });

                // Perform decoding
                filterA.subtract(filterB);
                const deduction = filterA.decode();

                let msg: string;

                msg = "Expect deduction.local to be a subset of A − B";
                deduction.local.forEach((element: Uint8Array) => {
                    expect(containsElement(elementsAunique, element), msg).to.be.true;
                });

                msg = "Expect deduction.remote to be a subset of B − A";
                deduction.remote.forEach((element: Uint8Array) => {
                    expect(containsElement(elementsBunique, element), msg).to.be.true;
                });

                if (deduction.complete) {
                    msg = "Expect A − B to be a subset of deduction.local";
                    elementsAunique.forEach((element: Uint8Array) => {
                        expect(containsElement(deduction.local, element)).to.be.true;
                    });

                    msg = "Expect B − A to be a subset of deduction.remote";
                    elementsBunique.forEach((element: Uint8Array) => {
                        expect(containsElement(deduction.remote, element)).to.be.true;
                    });
                }

            });
        }
    }
})
