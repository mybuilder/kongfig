import expect from 'expect.js';
import {normalize} from '../src/utils'

describe("consumers", () => {
    it("should normalize attributes", () => {
        const attr = {
            "config.foo": 1,
            "config.bar": 2,
        }

        expect(normalize(attr)).to.be.eql({config: {foo: 1, bar: 2}});
    });

    it("should normalize nested attributes", () => {
        const attr = {
            "config": {
                "foo.bar": null,
                "foo.bar2": 1
            }
        }

        expect(normalize(attr)).to.be.eql({config: {foo: {bar: null, bar2: 1}}});
    });
});
