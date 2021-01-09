'use strict';

console.log('running test file1');

var chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const simpleMySQL = require('../lib/main');

var connection_config = {
    user: 'test_user',
    password: 'test_pswd',
    host: 'mysql8-sample',
    port: 33060,
    schema: 'test_db'
};
var connection_options = {
    pooling: { enabled: true, maxIdleTime: 30000, maxSize: 25, queueTimeout: 10000 }
};

var mysql = simpleMySQL(connection_config, connection_options);

describe('Integration testing', function () {
    it('Wait and connect to DB (test waiting behaviour by starting db a bit later)', function () {
        this.timeout(0); // mocha to allow this test to be slow
        return mysql.awaitDbInit({ retries: 12, factor: 2, minTimeout: 1000, randomise: true })
        .then(db_info => {
            // {
            //     pooling: true,
            //     auth: 'PLAIN',
            //     schema: 'test_db',
            //     ssl: true,
            //     user: 'test_user',
            //     host: 'mysql8-sample',
            //     port: 33060,
            //     dbUser: 'test_user',
            //     socket: undefined
            // }
            expect(db_info).to.have.property('pooling');
            expect(db_info.pooling).to.be.true;
        });
    });
    it('?? How to test for disconnection?');
    it('CREATE TABLE', function () {
        var k = new Promise((resolve, reject) => {
            setTimeout(resolve, 1000);
        })
        .then(() => {
            return 3;
        });
        return expect(k).to.eventually.equal(3);
    });
    it('does nothing again');
    it('Disconnect and end the program cleanly', function () {
        return mysql.close();
    });
})