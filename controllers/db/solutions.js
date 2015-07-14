
module.exports = function(knex, req, res, next) {
    var q = knex.select("solutions.*").from('solutions').whereNull('is_correct');
    if (req.body.ids) q.whereIn('solutions.id', req.body.ids);
    q.join('users', 'solutions.user_id', '=', 'users.id').select('users.name as user_name');
    q.join('tasks', 'solutions.task_id', '=', 'tasks.id').select('tasks.title as task_title',
        'tasks.skills as task_skills', 'tasks.exp as task_exp', 'tasks.description as task_description');
    if (req.body.skills) q.andWhere('tasks.skills', '&&', req.body.skills);
    q.limit(10).offset(req.body.offset || 0);

    q.then(function(rows) {
        if (!rows) return res.end();
        res.end(JSON.stringify(rows));

    }).catch(function (error) {
        console.log(error);
        res.end();
    });
};