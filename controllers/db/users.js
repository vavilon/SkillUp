
module.exports = function (knex, req, res, next) {
    var q = knex.select("users.*").from('users');
    if (req.body.id) q.where('users.id', req.body.id);
    else if (req.body.ids) q.whereIn('users.id', req.body.ids);
    q.leftJoin('skills_progress', 'id', '=', 'user_id').select(knex.raw("array_agg((skill_id, count)) AS skills"))
        .groupBy('id').limit(20).offset(req.body.offset || 0).then(function(rows) {
            if (!rows) res.end();
            else res.end(JSON.stringify(rows));
    }).catch(function (error) {
        console.log(error);
        res.end();
    });
};