'use strict';

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
};
var wait_time_sec = parseInt(process.env['DB_WAIT_TIME']);
console.log('Waiting for database connection...');

var mysql = simpleMySQL(connection_config, connection_options);

mysql.awaitDbInit({ retries: 12, factor: 2, minTimeout: 1000, randomise: true })
.then(db_info => {
    console.log('db is ready');
    console.log(db_info);

    return Promise.resolve()
    .then(() => {
        // test simple queries
        console.log('test simple query: create a table');
        var q = 'CREATE TABLE IF NOT EXISTS simple_test (\
                                            id INT PRIMARY KEY AUTO_INCREMENT, \
                                            v1 INT, \
                                            v2 INT, \
                                            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP\
                                            )';
        return mysql.query(q);
    })
    .then(() => {
        console.log(`table created, manual test for disconnection, ${wait_time_sec} seconds`);
        return new Promise((resolve, reject) => {
            setTimeout(resolve, wait_time_sec*1000);
            console.log('has the db been disconnected manually? reconnected manually? assume test complete, continuing')
        });
    })
    .then(() => {
        console.log('Insert a single row');
        var q = 'INSERT INTO simple_test (v1, v2) VALUES (0, 12)';
        return mysql.query(q)
        .then(d => {
            console.log(d);
        });
    })
    .then(() => {
        console.log('Select all data');
        var q = 'SELECT * FROM simple_test;';
        return mysql.query(q)
        .then(d => {
            console.log(d);
        });
    })
    .then(() => {
        console.log('Insert 3 more rows');
        var q = 'INSERT INTO simple_test (v1, v2) VALUES (1, 13), (2, 14), (3, 15)';
        return mysql.query(q);
    })
    .then(() => {
        console.log('Select all data');
        var q = 'SELECT * FROM simple_test';
        return mysql.query(q)
        .then(d => {
            console.log(d);
        });
    })
    .then(() => {
        console.log('Select the 3rd row');
        var q = 'SELECT * FROM simple_test WHERE id = 2';
        return mysql.query(q)
        .then(d => {
            console.log(d);
        });
    })
    .then(() => {
        console.log('Select a row that doesn\'t exist');
        var q = 'SELECT * FROM simple_test WHERE id = 8';
        return mysql.query(q)
        .then(d => {
            console.log(d);
        });
    })
    .then(() => {
        // test transactional queries 1
        console.log('test transactional query, select, change sth dynamically, then update it back');
        return mysql.startTransaction()
        .then(transaction => {
            
            var q1 = 'SELECT id, v1, v2 FROM simple_test WHERE v2 = 13 LIMIT 1;';
            return transaction.query(q1)
            .then(r1 => {
                console.log(r1);

                var new_v1 = r1[0].id * (10 + r1[0].v1);
                var q2 = 'UPDATE simple_test SET v1 = ? WHERE id = ?;'
                return transaction.query(q2, [new_v1, r1[0].id]);
            })
            .then(() => {
                // then commit the transaction
                return transaction.commit();
            })
            .catch(err => {
                // rollback the transaction
                console.log(err);
                return transaction.rollback();
            })
        })
        .catch(err => {
            console.log('Transaction failed');
            console.log(err);
        });
    })
    .then(() => {
        console.log('Select all data after transaction 1');
        var q = 'SELECT * FROM simple_test';
        return mysql.query(q)
        .then(d => {
            console.log(d);
        });
    })
    .then(() => {
        // test transactional queries 2: Trying to test commit failures.
        console.log('test transactional query 2, rolling back a transaction');
        return mysql.startTransaction()
        .then(transaction => {
            
            var q1 = 'SELECT id, v1, v2 FROM simple_test WHERE v2 = 13 LIMIT 1;';
            return transaction.query(q1)
            .then(r1 => {
                console.log(r1);

                // transaction deals with atomicity
                // trying to test for read reliability like here is attempting to consider isolation levels
                console.log('Perform transaction query 1');
                var intercepted = 'UPDATE simple_test SET v1 = 1000 WHERE id = ?;';
                return transaction.query(intercepted, [r1[0].id])
                .then(() => {
                    console.log('After transaction query 1, view from within transaction');
                    return transaction.query('SELECT * FROM simple_test;')
                    .then(d1 => {
                        console.log(d1);
                    });
                })
                .then(() => {
                    console.log('After transaction query 1, view from outside transaction (default isolation: REPEATABLE READ)');
                    return mysql.query('SELECT * FROM simple_test;')
                    .then(d1 => {
                        console.log(d1);
                    });
                })
                .then(() => {
                    console.log('FAIL when doing transaction query 2');
                    var new_v1 = r1[0].id * (10 + r1[0].v1);
                    var q2 = 'UPDATE ssimple_test SET v1 = ? WHERE id = ?;'
                    return transaction.query(q2, [new_v1, r1[0].id]);
                })
            })
            .then(() => {
                // then commit the transaction
                return transaction.commit();
            })
            .catch(err => {
                console.log(err);
                console.log('Transaction failed');
                return transaction.rollback();
            });
        })
        .catch(err => {
            console.log('Fail to START transaction 2')
            return Promise.reject(err);
        });
    })
    .then(() => {
        console.log('Select all data after transaction test 2');
        var q = 'SELECT * FROM simple_test';
        return mysql.query(q)
        .then(d => {
            console.log(d);
        });
    })
    .then(() => {
        console.log('test simple query: drop the table');
        var q = 'DROP TABLE simple_test';
        return mysql.query(q);
    })
    .then(() => {
        console.log('everything seems ok');
        mysql.close();
    })
    .catch(err => {
        // fail from a bad query or from a network outage
        console.log(err)
        if (err.info) {
            console.log('Some query has failed, probably because of bad sql');
        } else {
            console.log('Some query has failed, not due to bad sql. may be network-related or syntax-related issues');
        }
        mysql.close();
    });
})
.catch(err => {
    console.log(err)
    console.log('database connection doesn\'t seem forthcoming. giving up...');
    try {
        mysql.close();
    } catch (e) {
        console.log(e)
    }
});





// console.log('waiting for db');
// setTimeout(() => {
//     var mysql = simpleMySQL(connection_config, connection_options);
//     mysql.inspect()
//     .then(data => {
//         console.log(data);
//         return mysql.close();
//     })
//     .catch(err => {
//         console.log(err);
//         setTimeout(() => {
//             mysql.inspect()
//             .then(data => {
//                 console.log(data);
//                 return mysql.close();
//             });
//         }, 30000);
//     });
// }, 1000);



