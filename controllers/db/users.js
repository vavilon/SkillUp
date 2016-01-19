
module.exports = function (knex, req, res, next) {
    var query = knex.select("users.*").from('users');
    if (req.body.id) query.where('users.id', req.body.id);
    else if (req.body.ids) query.whereIn('users.id', req.body.ids);
    query.leftJoin('user_skills', 'id', '=', 'user_id').select(knex.raw("array_agg((skill_id, count, need)) AS skills"));
    if (req.body.skills) {
        var subquery = knex('user_skills').select('user_id').where('count', '>', 0)
            .whereIn('skill_id', req.body.skills).groupBy('user_id').orderByRaw('count(skill_id) desc')
            .orderByRaw('sum(count) desc').limit(req.body.limit > 100 ? 20 : req.body.limit || 20).offset(req.body.offset || 0);
        query.whereIn('users.id', subquery);
    }
    else query.limit(req.body.limit > 100 ? 20 : req.body.limit || 20).offset(req.body.offset || 0);
    query.groupBy('id');
    query.then(function(rows) {
        res.end(JSON.stringify(rows));
    }).catch(function (error) {
        console.log(error);
        res.end();
    });
};