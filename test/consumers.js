import expect from 'expect.js';
import {consumers, credentials, acls} from '../src/core.js';
import {createConsumer, removeConsumer, addConsumerCredentials, updateConsumerCredentials, removeConsumerCredentials, addConsumerAcls, removeConsumerAcls} from '../src/actions.js';
import {getSupportedCredentials, addSchema, getSchema, addSchemasFromOptions, addSchemasFromConfig} from '../src/consumerCredentials.js';

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
            hasConsumer: (name) => name == 'marketplace',
            getConsumerId: username => 'user-1234',
        }));

        expect(actual).to.be.eql([
            removeConsumer('user-1234')
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
            ).map(x => x({
                getConsumerId: username => 'user-1234',
                hasConsumerCredential: () => false,
            }));

            expect(actual).to.be.eql([
                addConsumerCredentials('user-1234', 'oauth2', {"client_id": 'foo'})
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
                getConsumerId: username => 'user-1234',
                getConsumerCredentialId: () => '1234',
                hasConsumerCredential: () => true,
                isConsumerCredentialUpToDate: () => false}));

            expect(actual).to.be.eql([
                updateConsumerCredentials('user-1234', 'oauth2', '1234', {"client_id": 'foo', "redirect-uri": 'foo/bar'})
            ]);
        });

        it("should remove consumer credentials", () => {
            var actual = credentials('app-name', [{
                    "name": "oauth2",
                    "ensure": 'removed',
                    'attributes': {
                        "client_id": 'foo'
                    }
                }]
            ).map(x => x({
                getConsumerId: username => 'user-1234',
                getConsumerCredentialId: () => '1234',
                hasConsumerCredential: () => true}),
            );

            expect(actual).to.be.eql([
                removeConsumerCredentials('user-1234', 'oauth2', '1234')
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
            ).map(x => x({
                getConsumerId: username => 'user-1234',
                hasConsumerCredential: () => false,
            }));

            expect(actual).to.be.eql([
                addConsumerCredentials('user-1234', 'jwt', {"key": 'somekey', "secret": 'super-secret'})
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
                getConsumerId: username => 'user-1234',
                getConsumerCredentialId: () => '1234',
                hasConsumerCredential: () => true,
                isConsumerCredentialUpToDate: () => false}));

            expect(actual).to.be.eql([
                updateConsumerCredentials('user-1234', 'jwt', '1234', {"key": 'somekey', "secret": 'new-super-secret'})
            ]);
        });

        it("should remove consumer", () => {
            var actual = credentials('app-name', [{
                    "name": "jwt",
                    "ensure": 'removed',
                    'attributes': {
                        key: 'somekey'
                    }
                }]
            ).map(x => x({
                getConsumerId: username => 'user-1234',
                getConsumerCredentialId: () => '1234',
                hasConsumerCredential: () => true})
            );

            expect(actual).to.be.eql([
                removeConsumerCredentials('user-1234', 'jwt', '1234')
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
            ).map(x => x({
                getConsumerId: username => 'user-1234',
                hasConsumerCredential: () => false,
            }));

            expect(actual).to.be.eql([
                addConsumerCredentials('user-1234', 'basic-auth', {"username": 'user', "password": 'password'})
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
                getConsumerId: username => 'user-1234',
                getConsumerCredentialId: () => '1234',
                hasConsumerCredential: () => true,
                isConsumerCredentialUpToDate: () => false
            }));

            expect(actual).to.be.eql([
                updateConsumerCredentials('user-1234', 'basic-auth', '1234', {"username": 'user', "password": 'new-password'})
            ]);
        });

        it("should remove consumer credential", () => {
            var actual = credentials('app-name', [{
                    "name": "basic-auth",
                    "ensure": 'removed',
                    'attributes': {
                        username: 'user'
                    }
                }]
            ).map(x => x({
                getConsumerId: username => 'user-1234',
                getConsumerCredentialId: () => '1234',
                hasConsumerCredential: () => true
            }));

            expect(actual).to.be.eql([
                removeConsumerCredentials('user-1234', 'basic-auth', '1234')
            ]);
        });
    });

    describe('acl', () => {
        it("should add acl", () => {
            var actual = acls('app-name', [{
                    "name": "acls",
                    'group': 'super-group-name'
                }]
              ).map(x => x({
                  getConsumerId: username => 'user-1234',
                  hasConsumerAcl: () => false,
              })
            );

            expect(actual).to.be.eql([
                addConsumerAcls('user-1234', "super-group-name")
            ]);
        });

        it("should remove consumer acl", () => {
            var actual = acls('app-name', [{
                "name": "acls",
                "ensure": 'removed',
                'group': 'super-group-name',
            }]).map(x => x({
                getConsumerId: username => 'user-1234',
                getConsumerAclId: () => '1234',
                hasConsumerAcl: () => true,
            }));

            expect(actual).to.be.eql([
                removeConsumerAcls('user-1234', '1234')
            ]);
        });
    });

    describe('consumer credentials', () => {
        it("should get credentials", () => {
            const credentials = getSupportedCredentials();
            credentials.forEach(name => {
                const schema = getSchema(name);
                expect(schema).not.to.be.null;
                expect(schema).to.have.property('id');
            })
        });

        it("should add custom credential", () => {
            const name = 'custom_jwt';
            const schema = {
                "id": "key"
            }

            addSchema(name, schema);
            expect(getSchema(name)).to.be.eql(schema);
        });

        it("should not add custom credential without id", () => {
            const name = 'custom_jwt2';
            const schema = {
                "noid": "value"
            }

            expect(() => { addSchema(name, schema) }).to.throwException(Error);
        });

        it("should not update credential", () => {
            const name = 'jwt';
            const schema = {
                "id": "key"
            }

            expect(() => { addSchema(name, schema) }).to.throwException(Error);
        });

        it("should add custom credentials from cli options", () => {
            const opts = ['custom_jwt3:key', 'custom_oauth2:client_id'];

            expect(() => { addSchemasFromOptions(opts) }).to.not.throwException(Error);
            expect(getSchema('custom_jwt3')).to.be.eql({id: 'key'});
            expect(getSchema('custom_oauth2')).to.be.eql({id: 'client_id'});
        });

        it("should validate custom credentials from cli options", () => {
            ['custom_jwt4|nocolon', 'custom_oauth2_2:client_id:extracolon']
                .forEach((opt) => {
                    expect(() => { addSchemasFromOptions([opt]) }).to.throwException(Error);
                })
        });

        it("should add custom credentials from config", () => {
            const conf = {
                credentialSchemas: {
                    custom_jwt5: {id: 'key'},
                    custom_oauth2_3: {id: 'client_id'},
                }
            }

            expect(() => {  addSchemasFromConfig(conf) }).to.not.throwException(Error);
            expect(getSchema('custom_jwt5')).to.be.eql({id: 'key'});
            expect(getSchema('custom_oauth2_3')).to.be.eql({id: 'client_id'});
        });
    });
});
