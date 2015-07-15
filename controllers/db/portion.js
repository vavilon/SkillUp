
module.exports = function(knex, options, callback) {
    var tableName = options.tableName;
    var ids = options.ids;
    var andWhere = options.andWhere;
    var select = options.select;
    var limit = options.limit;
    var offset = options.offset;

    var query = knex(tableName);
    if (ids) query = query.whereIn('id', ids);
    if (andWhere) query = query.andWhere(andWhere[0], andWhere[1], andWhere[2]);
    query.select(select).limit(limit).offset(offset || 0)
        .then(function(rows) {
            callback(rows);
        }).catch(function (error) {
            console.log(error);
            callback(null, error);
        });
};