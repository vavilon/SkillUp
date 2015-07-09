
module.exports = function(knex, tableName, ids, select, limit, offset, callback) {
    if (ids) {
        knex(tableName).whereIn('id', ids).select(select).limit(limit).offset(offset || 0)
            .then(function(rows) {
                callback(rows);
            }).catch(function (error) {
                console.log(error);
                callback(null, error);
            });
    }
    else {
        knex(tableName).select(select).limit(limit).offset(offset || 0)
            .then(function(rows) {
                callback(rows);
            }).catch(function (error) {
                console.log(error);
                callback(null, error);
            });
    }
};