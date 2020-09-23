# MySimpleMySql8

## Features

MySql8 connector exposing some common use-cases with a simple api.
* Connection pooling
* Basic SQL queries (using common SQL syntax instead of chainable api)
* Transactions
* Collections (only supports chainable api)

Additional features
* Init Promise: Wait for database connection to be up before resolving (useful for running in docker, esp in dev)

## Usage (something like this, but not exactly)

```
const simpleMySQL = require('mysimplemysql8');

var connection_config = {
    user: 'test_user',
    password: 'test_pswd',
    host: 'mysql8-sample',
    port: 33060,
    schema: 'test_db'
};
var connection_options = {
    pooling: { enabled: true, maxIdleTime: 30000, maxSize: 25, queueTimeout: 10000 }
}

var mysql = simpleMySQL(connection_config, connection_options);

var retry_params = {
    retries: 10,
    factor: 2,
    minTimeout: 1000,
    randomise: true
};

# wait for connection
mysql.awaitDbInit(retry_params) # if retry_params not supplied, defaults to the above
.then(() => {
    // connection is ready
})

# test for connection
mysql.inspect()
.then(data => {
    // do your stuff
});

# perform simple query
mysql.query('SELECT col1, col2 FROM some_table WHERE col3 = ?', [col3_binding])
.then(data => {
    // do your stuff
});

# start transaction

Promise.resolve()
.then(() => {
    return mysql.startTransaction()
})
.then(mysqlTrans => {
    return mysqlTrans.query('SELECT col1, col2 FROM some_table WHERE col3 = ?', [col3_binding])
    .then(data => {
        // do some stuff
        var col3_binding = 'abcde';
        return mysqlTrans.query('SELECT col1, col2 FROM other_table WHERE col3 = ?', [col3_binding]);
    })
    .then(data => {
        // do more stuff
    })
    .then(() => {
        return mysqlTrans.commit()
    })
    .catch(err => {
        return mysqlTrans.rollback()
    });
})
.catch(err => {
    // transaction failed to start
    // OR rollback failure
})
.then(() => {
    // transaction ok
    // OR rollback successful
});

```


## Run tests

```
cd dockerised
docker-compose up --build
```
