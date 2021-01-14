# mysql-xdevapi

## Features

A thin wrapper around the official MySql8 XDevAPI connector, exposing some common use-cases with a simple promise-based api.

* [x] Connection pooling
* [x] Easy api to test for db connection
* [x] SQL queries (using SQL statements instead of chainable api)
* [ ] Transactions (WIP)
* [ ] Collections (only supports chainable api)
* [ ] Expose underlying mysqlx.client object
* Attempt to be compatible with multiple versions of [@mysql/xdevapi](https://www.npmjs.com/package/@mysql/xdevapi):
    * [x] v8.0.22 (maybe change to a peer dependency?)

Additional features and notes
* Init Promise:
    * Wait for database connection to be up before resolving (useful for running in docker, esp in dev)
* Dropped connections: 
    * If connection to DB drops, queries will fail and throw an error.
    * When connection to DB comes back, queries will be successful again without needing to re-initialize the client.

## Usage

### Connect to DB
```
const simpleMySQL = require('simple-mysql');

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
```

### Test for Connection / Get Connection Params
```
mysql.inspect()
.then(data => {
    // do your stuff
    // data {
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
});
```

### Perform Simple Query
```
mysql.query('SELECT col1, col2 FROM some_table WHERE col3 = ?', [col3_binding])
.then(data => {
    // do your stuff
});
```

### Transaction (WIP)
```
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

## Run example

```
cd dev
docker-compose -f docker-compose-example.yml up --build
```

## Run tests

```
cd dev
docker-compose -f docker-compose-mocha.yml up --build
```
