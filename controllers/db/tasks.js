
module.exports = function(knex, req, res, next) {
    var q = knex.select("tasks.*").from('tasks');
    if (req.body.ids) q.whereIn('tasks.id', req.body.ids);
    if (req.body.skills) q.andWhere('tasks.skills', (req.body.filters && req.body.filters.for_approving) || req.body.completed_skills
        ? '<@' : '&&', req.body.skills);
    q.leftJoin('users', 'tasks.author', '=', 'users.id').select('users.name as author_name');
    if (req.body.filters) {
        if (req.body.filters.for_solving || req.body.filters.is_approved === true) q.andWhere('tasks.is_approved', '=', true);
        else if (req.body.filters.is_approved === false) q.andWhere('tasks.is_approved', '=', false);
        // Не менять на просто else, чтобы можно было загружать все задания, указав в is_approved любое,
        // отличное от true, false или undefined значение
        else if (req.body.filters.for_approving || req.body.filters.is_approved === undefined) q.whereNull('tasks.is_approved');

        if (req.user.attributes.tasks_created && (req.body.filters.for_solving || req.body.filters.for_approving ||  req.body.filters.not_in_created))
            q.whereNotIn('tasks.id', req.user.attributes.tasks_created);
        if (req.user.attributes.tasks_approved && (req.body.filters.for_approving || req.body.filters.not_in_approved))
            q.whereNotIn('tasks.id', req.user.attributes.tasks_approved);
        if (req.user.attributes.tasks_done && (req.body.filters.for_solving || req.body.filters.not_in_done)) {
            q.leftJoin('solutions', 'solutions.task_id', '=', 'tasks.id');
            q.whereNotIn('solutions.id', req.user.attributes.tasks_done).orWhereNull('solutions.id');
        }

        if (req.body.filters.received === true) q.whereIn('tasks.id', req.user.attributes.tasks_received);
        else if (req.user.attributes.tasks_received && (req.body.filters.received === false))
            q.whereNotIn('tasks.id', req.user.attributes.tasks_received);

        if (req.body.filters.liked === true) q.whereIn('tasks.id', req.user.attributes.tasks_liked);
        else if (req.user.attributes.tasks_liked && (req.body.filters.liked === false))
            q.whereNotIn('tasks.id', req.user.attributes.tasks_liked);
    }
    q.limit(20).offset(req.body.offset || 0);

    q.then(function(rows) {
        if (!rows.length) console.log(q.toString());
        if (!rows) return res.end();
        res.end(JSON.stringify(rows));

    }).catch(function (error) {
        console.log(error);
        res.end();
    });
};