'use strict';

console.log('running test file1');

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const expect = chai.expect;

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

describe('Test basic DB connector features', function () {
    it('Wait and connect to DB (test waiting behaviour by starting db a bit later)', function () {
        this.timeout(0); // mocha to allow this test to be slow

        // implicitly expect this promise to resolve
        return mysql.awaitDbInit({ retries: 5, factor: 2, minTimeout: 1000, randomise: true })
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
        
            // explicitly define the expected properties
            expect(db_info).to.have.property('pooling');
            expect(db_info.pooling).to.be.true;
            expect(db_info).to.have.property('auth');
            expect(db_info).to.have.property('schema');
            expect(db_info).to.have.property('ssl');
            expect(db_info).to.have.property('user');
            expect(db_info).to.have.property('host');
            expect(db_info).to.have.property('port');
            expect(db_info).to.have.property('dbUser');
            expect(db_info).to.have.property('socket');
        });
    });
    it('Ensure test table doesn\'t exist', function () {
        var q = `SHOW TABLES;`;
        return mysql.query(q)
        .then(tablelist => {
            expect(tablelist.rows).to.equal(0);
        });
    });
    it('Create test table', function () {
        var q = `CREATE TABLE IF NOT EXISTS simple_test (
            id INT PRIMARY KEY AUTO_INCREMENT, 
            v1 INT, 
            v2 INT, 
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP\
            )`;
        return expect(mysql.query(q)).to.eventually.be.fulfilled;
    });
    it('Ensure test table exists', function () {
        var q = `SHOW TABLES;`;
        return mysql.query(q)
        .then(tablelist => {
            // library returns a array of row data results,
            // with additional properties `rows` and `column_names`
            // [
            //     { Tables_in_test_db: 'simple_test' },
            //     rows: 1,
            //     column_names: [ 'Tables_in_test_db' ]
            // ]
            expect(tablelist.rows).to.equal(1);
            expect(tablelist[0][tablelist.column_names[0]]).to.equal('simple_test');
        });
    });
    it('Insert 2 rows of data into test table', function () {
        var q = `INSERT INTO simple_test (v1, v2) VALUES (?, ?);`
        return Promise.all([
            expect(mysql.query(q, [4, 8])).to.eventually.be.fulfilled,
            expect(mysql.query(q, [6, 12])).to.eventually.be.fulfilled
        ]);
    });
    it('Get all data from test table, data returned in correct format', function () {
        var q = `SELECT * FROM simple_test;`
        return mysql.query(q)
        .then(data => {
            // [
            //     { id: 1, v1: 4, v2: 8, last_updated: 2021-01-10T07:30:07.000Z },
            //     { id: 2, v1: 6, v2: 12, last_updated: 2021-01-10T07:30:07.000Z },
            //     rows: 2,
            //     column_names: [ 'id', 'v1', 'v2', 'last_updated' ]
            // ]
            expect(data.rows).to.equal(2);
            expect(data.column_names.length).to.equal(4);
            for (let j=0; j<data.rows; j++) {
                for (let i=0; i<data.column_names.length; i++) {
                    expect(data[j]).to.have.property(data.column_names[i]);
                }
            }
        });
    });
    it('Update data in test table', function () {
        var q = `UPDATE simple_test SET v1 = ?, v2 = ? WHERE v1 = 4;`
        return expect(mysql.query(q, [5, 9])).to.eventually.be.fulfilled;
    });
    it('Ensure update succeeded', function () {
        var q = `SELECT id, v1, v2 FROM simple_test where v1 = ?;`
        return mysql.query(q, [5])
        .then(data => {
            // [
            //     { id: 1, v1: 5, v2: 9 },
            //     rows: 1,
            //     column_names: [ 'id', 'v1', 'v2' ]
            // ]
            expect(data.rows).to.equal(1);
            expect(data.column_names.length).to.equal(3);
            for (let j=0; j<data.rows; j++) {
                for (let i=0; i<data.column_names.length; i++) {
                    expect(data[j]).to.have.property(data.column_names[i]);
                }
            }
            expect(data[0].v1).to.equal(5);
            expect(data[0].v2).to.equal(9);
        });
    });
    it('Drop test table', function () {
        var q = `DROP TABLE IF EXISTS simple_test;`;
        return expect(mysql.query(q)).to.eventually.be.fulfilled;
    });
    it('Ensure test table has been dropped', function () {
        var q = `SHOW TABLES;`;
        return mysql.query(q)
        .then(tablelist => {
            // [
            //     { Tables_in_test_db: 'simple_test' },
            //     rows: 1,
            //     column_names: [ 'Tables_in_test_db' ]
            // ]
            expect(tablelist.rows).to.equal(0);
            expect(tablelist.column_names[0]).to.equal('Tables_in_test_db');
        });
    });
    it('Disconnect and end the program cleanly', function () {
        return expect(mysql.close()).to.eventually.be.fulfilled;
    });
})