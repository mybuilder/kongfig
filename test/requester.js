import expect from 'expect.js';
import requester from '../src/requester.js';

let actualRequest = {};

global.fetch = (url, options) => {
    actualRequest = {
        url,
        options
    };

    const promise = {
        then: () => promise,
        catch: () => promise,
    };

    return promise;
};

describe('requester', () => {
    beforeEach(() => {
        actualRequest = {};
        requester.clearHeaders();
    });

    it('should get', () => {
        const expectedRequest = {
            url: 'http://example.com',
            options: {
              method: 'GET',
              headers: {
                  'Connection': 'keep-alive',
                  'Accept': 'application/json'
              }
            }
        };

        requester.get('http://example.com');

        expect(actualRequest).to.be.eql(expectedRequest);
    });

    it('should get with custom headers', () => {
        const expectedRequest = {
            url: 'http://example.com',
            options: {
              method: 'GET',
              headers: {
                  'Connection': 'keep-alive',
                  'Accept': 'application/json',
                  'CustomHeader1': 'CustomValue1',
                  'CustomHeader2': 'CustomValue2'
              }
            }
        };

        requester.addHeader('CustomHeader1', 'CustomValue1');
        requester.addHeader('CustomHeader2', 'CustomValue2');
        requester.get('http://example.com');

        expect(actualRequest).to.be.eql(expectedRequest);
    });

    it('should make requests', () => {
        const expectedRequest = {
            url: 'http://example.com',
            options: {
              method: 'POST',
              headers: {
                  'Connection': 'keep-alive',
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              },
              body: 'This is the body'
            }
        };

        requester.request('http://example.com', {
            method: 'POST',
            body: 'This is the body',
            headers: {
                'Connection': 'keep-alive',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
          });

        expect(actualRequest).to.be.eql(expectedRequest);
    });

    it('should make requests with custom headers', () => {
        const expectedRequest = {
            url: 'http://example.com',
            options: {
              method: 'POST',
              headers: {
                  'Connection': 'keep-alive',
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'CustomHeader1': 'CustomValue1',
                  'CustomHeader2': 'CustomValue2'
              },
              body: 'This is the body'
            }
        };

        requester.addHeader('CustomHeader1', 'CustomValue1');
        requester.addHeader('CustomHeader2', 'CustomValue2');
        requester.request('http://example.com', {
            method: 'POST',
            body: 'This is the body',
            headers: {
                'Connection': 'keep-alive',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
          });

        expect(actualRequest).to.be.eql(expectedRequest);
    });

    it('should clear headers', () => {
      const expectedRequest = {
          url: 'http://example.com',
          options: {
            method: 'GET',
            headers: {
                'Connection': 'keep-alive',
                'Accept': 'application/json'
            }
          }
      };

      requester.addHeader('CustomHeader1', 'CustomValue1');
      requester.addHeader('CustomHeader2', 'CustomValue2');
      requester.clearHeaders();
      requester.get('http://example.com');

      expect(actualRequest).to.be.eql(expectedRequest);
    });
});
