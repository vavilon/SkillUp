
var config = require('../../config');
var pg = require('pg');
var conObj = config.get('knex').connection;
var conString = "postgres://" + conObj.user + ":" + conObj.password + "@" + conObj.host + "/" + conObj.database;

module.exports = function(table, column, rowID, operation, value, callback) {
    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("UPDATE " + table + " SET " + column + " = array_" + operation + "(" + column + ", '" + value + "') WHERE id = '" + rowID + "';",
            function (err, result) {
                done(client);
                callback(err, result);
            });
    });
};