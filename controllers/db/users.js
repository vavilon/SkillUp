
module.exports = function (knex, req, res, next) {
    var q = knex.select("users.*").from('users');
    if (req.body.id) q.where('users.id', req.body.id);
    else if (req.body.ids) q.whereIn('users.id', req.body.ids);
    q.leftJoin('user_skills', 'id', '=', 'user_id').select(knex.raw("array_agg((skill_id, count, need)) AS skills"))
        .groupBy('id').limit(req.body.limit > 100 ? 20 : req.body.limit).offset(req.body.offset || 0);

    q.then(function(rows) {
        if (!rows) res.end();
        else res.end(JSON.stringify(rows));
    }).catch(function (error) {
        console.log(error);
        res.end();
    });
};