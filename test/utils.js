import expect from 'expect.js';
import {normalize} from '../src/utils'

describe("normalize utils", () => {
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

    it("should preserve arrays", () => {
        const attr = {
            "config": {
                "foobar": ["a", "b"]
            }
        }

        const actual = normalize(attr);

        expect(normalize(attr)).to.be.eql({config: { foobar: ["a", "b"] }});
        expect(actual.config.foobar).to.be.an('array');
    });
});
