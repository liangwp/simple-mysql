'use strict';

var chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const simpleMySQL = require('../lib/main');

describe('abcde', () => {
    it('does nothing');
    it('does something', () => {
        var k = Promise.resolve(3);
        return expect(k).to.eventually.equal(3);
    });
    it('does nothing again');
})