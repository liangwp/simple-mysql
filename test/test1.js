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
var wait_time_sec = parseInt(process.env['DB_WAIT_TIME']);
console.log('Waiting for database connection...');

var mysql = simpleMySQL(connection_config, connection_options);

describe('Integration testing', () => {
    it('Wait and connect to DB (test waiting behaviour by starting db a bit later)', () => {
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
    it('CREATE TABLE', () => {
        var k = Promise.resolve(3);
        return expect(k).to.eventually.equal(3);
    });
    it('does nothing again');
    it('Disconnect and end the program cleanly', () =>{
        return mysql.close();
    });
})