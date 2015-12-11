module.exports = function(knex) {
    return function (req, res, next) {
        knex(req.params.table).columnInfo().then(function(info) {
            res.end(JSON.stringify(info));
        });
    }
};
