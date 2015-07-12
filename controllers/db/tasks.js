
module.exports = function(knex, req, res, next) {
    var q = knex.select("tasks.*").from('tasks');
    if (req.body.ids) q.whereIn('tasks.id', req.body.id);
    if (req.body.skills) q.andWhere('tasks.skills', '&&', req.body.skills);
    q.join('users', 'tasks.author', '=', 'users.id').select('users.name as author_name');
    q.limit(10).offset(req.body.offset || 0);

    q.then(function(rows) {
        if (!rows) return res.end();
        res.end(JSON.stringify(rows));

    }).catch(function (error) {
        console.log(error);
        res.end();
    });
};