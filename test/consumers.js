import expect from 'expect.js';
import {consumers, credentials} from 'core';
import {createConsumer, removeConsumer, addConsumerCredentials, updateConsumerCredentials, removeConsumerCredentials} from 'actions';

describe("consumers", () => {
    it("should add new consumer", () => {
        var actual = consumers([{
            "ensure": "present",
            "username": "marketplace"
        }])
            .map(x => x({
                hasConsumer: () => false
            }));

        expect(actual).to.be.eql([
            createConsumer('marketplace')
        ]);
    });

    it("should remove consumer", () => {
        var actual = consumers([{
            "ensure": "removed",
            "username": "marketplace"
        }]).map(x => x({
            hasConsumer: (name) => name == 'marketplace'
        }));

        expect(actual).to.be.eql([
            removeConsumer('marketplace')
        ]);
    });

    it("should validate consumer", () => {
        expect(() => consumers([{
            "ensure": "present"
        }])).to.throwException(/Consumer username must be specified/);
    });

    describe("credentials", () => {
        it("should add oauth2 credential", () => {
            var actual = credentials('app-name', [{
                    "name": "oauth2",
                    'attributes': {
                        "client_id": 'foo'
                    }
                }]
            ).map(x => x({hasConsumerCredential: () => false}));

            expect(actual).to.be.eql([
                addConsumerCredentials('app-name', 'oauth2', {"client_id": 'foo'})
            ]);
        });

        it("should update the oauth2 credential", () => {
            var actual = credentials('app-name', [{
                    "name": "oauth2",
                    'attributes': {
                        "client_id": 'foo',
                        "redirect-uri": 'foo/bar'
                    }
                }]
            ).map(x => x({
                    getConsumerCredentialId: () => '1234',
                    hasConsumerCredential: () => true
                }));

            expect(actual).to.be.eql([
                updateConsumerCredentials('app-name', 'oauth2', '1234', {"client_id": 'foo', "redirect-uri": 'foo/bar'})
            ]);
        });

        it("should remove consumer", () => {
            var actual = credentials('app-name', [{
                    "name": "oauth2",
                    "ensure": 'removed',
                    'attributes': {}
                }]
            ).map(x => x({
                    getConsumerCredentialId: () => '1234',
                    hasConsumerCredential: () => true
                })
            );

            expect(actual).to.be.eql([
                removeConsumerCredentials('app-name', 'oauth2', '1234')
            ]);
        });
    });

    describe("jwt credentials", () => {
        it("should add jwt credential", () => {
            var actual = credentials('app-name', [{
                    "name": "jwt",
                    'attributes': {
                        "key": 'somekey',
                        "secret": 'super-secret'
                    }
                }]
            ).map(x => x({hasConsumerCredential: () => false}));

            expect(actual).to.be.eql([
                addConsumerCredentials('app-name', 'jwt', {"key": 'somekey', "secret": 'super-secret'})
            ]);
        });

        it("should update the jwt credential", () => {
            var actual = credentials('app-name', [{
                    "name": "jwt",
                    'attributes': {
                        "key": 'somekey',
                        "secret": 'new-super-secret'
                    }
                }]
            ).map(x => x({
                    getConsumerCredentialId: () => '1234',
                    hasConsumerCredential: () => true
                }));

            expect(actual).to.be.eql([
                updateConsumerCredentials('app-name', 'jwt', '1234', {"key": 'somekey', "secret": 'new-super-secret'})
            ]);
        });

        it("should remove consumer", () => {
            var actual = credentials('app-name', [{
                    "name": "jwt",
                    "ensure": 'removed',
                    'attributes': {}
                }]
            ).map(x => x({
                    getConsumerCredentialId: () => '1234',
                    hasConsumerCredential: () => true
                })
            );

            expect(actual).to.be.eql([
                removeConsumerCredentials('app-name', 'jwt', '1234')
            ]);
        });
    });

    describe('basic-auth', () => {
        it("should add basic auth credential", () => {
            var actual = credentials('app-name', [{
                    "name": "basic-auth",
                    'attributes': {
                        "username": 'user',
                        "password": 'password'
                    }
                }]
            ).map(x => x({hasConsumerCredential: () => false}));

            expect(actual).to.be.eql([
                addConsumerCredentials('app-name', 'basic-auth', {"username": 'user', "password": 'password'})
            ]);
        });

        it("should update the basic auth credential", () => {
            var actual = credentials('app-name', [{
                    "name": "basic-auth",
                    'attributes': {
                        "username": 'user',
                        "password": 'new-password'
                    }
                }]
            ).map(x => x({
                    getConsumerCredentialId: () => '1234',
                    hasConsumerCredential: () => true
                }));

            expect(actual).to.be.eql([
                updateConsumerCredentials('app-name', 'basic-auth', '1234', {"username": 'user', "password": 'new-password'})
            ]);
        });

        it("should remove consumer credential", () => {
            var actual = credentials('app-name', [{
                    "name": "basic-auth",
                    "ensure": 'removed',
                    'attributes': {}
                }]
            ).map(x => x({
                    getConsumerCredentialId: () => '1234',
                    hasConsumerCredential: () => true
                })
            );

            expect(actual).to.be.eql([
                removeConsumerCredentials('app-name', 'basic-auth', '1234')
            ]);
        });
    });
});
