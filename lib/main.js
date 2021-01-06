'use strict';

const mysqlx = require('@mysql/xdevapi');
const promiseRetry = require('promise-retry');

function jsonifySQLResult(SQLResult) {
    console.log('========');
    console.log(SQLResult);
    var cols = SQLResult.getColumns();
    console.log(cols);
    // this isn't a good idea. 0 rows and a row of nulls ends up looking the same
    return SQLResult.fetchAll().map(row => {
        var row_obj = {};
        for (let i = 0; i<row.length; i++) {
            row_obj[cols[i].name] = row[i];
        }
        return row_obj;
    });
}

function DbClient(connection, options) {
    this.client = mysqlx.getClient(connection, options);

    this.transaction_sessions = {};
}

DbClient.prototype.test1 = function () {
    return this.client.getSession()
    .then(s => {
        console.log(s);
    })
    .catch(err => { // fail to get session
        console.log(err);
    });
};



DbClient.prototype.awaitDbInit = function (params) {
    if (!params) {
        var params = {
            retries: 10,
            factor: 2,
            minTimeout: 1000,
            randomise: true
        }
    }
    return promiseRetry((retry, number) => {
        console.log(`Checking DB connection, attempt ${number}`);
        return this.inspect()
        .catch(retry);
    }, params);
};

DbClient.prototype.inspect = function () {
    var _sess = null;
    return this.client.getSession()
    .then(s => {
        _sess = s;
        return _sess.inspect();
    })
    .then(data => {
        _sess.close();
        return data;
    }, err => {
        // Tested err states:
        //  - ENOTFOUND: mysql container is not running
        //  - ECONNREFUSED: mysql server is not yet ready
        // there may be others

        console.error(err);
        if (_sess && _sess.close) {
            _sess.close();
        }
        return Promise.reject(err);
    });
};

DbClient.prototype.query = function (sql, bindings) {
    if (!bindings) {
        bindings = [];
    }
    var _sess = null;
    return this.client.getSession()
    .then(s => {
        _sess = s;
        return _sess.sql(sql).bind(bindings).execute()
        // .then(SQLResult => {
        //     if (sql.trim().toLowerCase().startsWith('insert ')) { // is this a good idea?
        //         return _sess.sql('SELECT LAST_INSERT_ID();').execute(); // if insert query, return the id of the row
        //     } else {
        //         return SQLResult;
        //     }
        // })
        .then(SQLResult => {
            _sess.close();
            return jsonifySQLResult(SQLResult);
        }, err => {
            _sess.close();
            return Promise.reject(err);
        });
    })
    .catch(err => {
        // if the query is made when db is disconnected, error will not contain the `info` field
        
        // recompose the standard error into something we prefer
        // console.log(err);
        
        var clean_sql = sql.replace(/\s+/g, ' ');
        var clean_msg = err.message.replace(/\s+/g, ' ');
        var e = new Error(`${clean_msg}`);
        if (err.info) {
            e.info = err.info;
            e.info.msg = e.info.msg.replace(/\s+/g, ' ');
            e.info.sql = clean_sql;
        } else {
            e = err; // NOT a mysql query error
        }
        return Promise.reject(e);
    });
};

DbClient.prototype.startTransaction = function () {
    return this.client.getSession()
    .then(_sess => {
        var wrapper = new TransactionWrapper(_sess);
        return _sess.startTransaction()
        .then(() => {
            return wrapper;
        });
    });
};

DbClient.prototype.close = function () {
    return this.client.close();
};




function TransactionWrapper(_sess) {
    this.session = _sess;
}

TransactionWrapper.prototype.query = function (sql, bindings) {
    if (!bindings) {
        bindings = [];
    }
    return this.session.sql(sql).bind(bindings).execute()
    // .then(SQLResult => {
    //     if (sql.trim().toLowerCase().startsWith('insert ')) { // is this a good idea?
    //         return _sess.sql('SELECT LAST_INSERT_ID();').execute(); // if insert query, return the id of the row
    //     } else {
    //         return SQLResult;
    //     }
    // })
    .then(SQLResult => {
        return jsonifySQLResult(SQLResult);
    });
}

TransactionWrapper.prototype.commit = function () {
    return this.session.commit();
};

TransactionWrapper.prototype.rollback = function () {
    return this.session.rollback();
};





// 2020.09.13 Stopped here

// collections api
// basically, return a collection and let it be the normal xdevapi



function factory(connection, options) {
    var db = new DbClient(connection, options);
    return db;
}

module.exports = factory;
