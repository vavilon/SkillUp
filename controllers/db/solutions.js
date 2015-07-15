
module.exports = function(knex, req, res, next) {
    var q = knex.select("solutions.*").from('solutions');
    if (req.body.ids) q.whereIn('solutions.id', req.body.ids);
    q.join('users', 'solutions.user_id', '=', 'users.id').select('users.name as user_name');
    q.join('tasks', 'solutions.task_id', '=', 'tasks.id').select('tasks.title as task_title',
        'tasks.skills as task_skills', 'tasks.exp as task_exp', 'tasks.description as task_description');
    if (req.body.skills) q.andWhere('tasks.skills',  (req.body.filters.for_checking || req.body.completed_skills) ? '<@' : '&&', req.body.skills);
    if (req.body.filters) {
        if (req.body.filters.for_checking || req.body.filters.is_correct === undefined) q.whereNull('solutions.is_correct');
        else if (req.body.filters.is_correct === true) q.andWhere('solutions.is_correct', '=', true);
        // Не менять на просто else, чтобы можно было загружать все решения, указав в is_correct любое,
        // отличное от true, false или undefined значение
        else if (req.body.filters.is_correct === false) q.andWhere('solutions.is_correct', '=', false);

        if (req.user.attributes.solutions_checked && (req.body.filters.for_checking || req.body.filters.not_in_checked))
            q.whereNotIn('tasks.id', req.user.attributes.solutions_checked);
        if (req.body.filters.for_checking || req.body.filters.not_own) q.andWhere('solutions.user_id', '!=', req.user.id);

        if (req.user.attributes.solutions_liked) {
            if (req.body.filters.liked === true) q.whereIn('solutions.id', req.user.attributes.solutions_liked);
            else if (req.body.filters.liked === false) q.whereNotIn('solutions.id', req.user.attributes.solutions_liked);
        }
    }
    q.limit(100).offset(req.body.offset || 0);

    q.then(function(rows) {
        if (!rows) return res.end();
        res.end(JSON.stringify(rows));

    }).catch(function (error) {
        console.log(error);
        res.end();
    });
};