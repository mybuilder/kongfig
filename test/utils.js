import expect from 'expect.js';
import {normalize, parseVersion} from '../src/utils'

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

describe("parseVersion utils", () => {
    it("should return the CE version", () => {
        expect(parseVersion("0.10.0")).to.be.eql("0.10.0");
    });

    it("should return the CE version", () => {
        expect(parseVersion("0.11.0-rc1")).to.be.eql("0.11.0");
    });

    it("should return the EE version", () => {
        expect(parseVersion("0.29-0-enterprise-edition")).to.be.eql("0.29.0");
    });

    it("should return the EE version", () => {
        expect(parseVersion("0.29-1-enterprise-edition")).to.be.eql("0.29.1");
    });

    it("should return the EE version with no patch", () => {
        expect(parseVersion("0.29-enterprise-edition")).to.be.eql("0.29.0");
    });
});
