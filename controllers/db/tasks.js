
module.exports = function(knex, req, res, next) {
    var q = knex.select("tasks.*").from(function () {
        this.select("tasks.*").from('tasks').leftJoin('task_skills', 'tasks.id', '=', 'task_skills.task_id')
            .select(knex.raw("array_agg((skill_id, count)) AS skills")).groupBy('tasks.id')
            .select(knex.raw("array_agg(skill_id) AS skills_ids")).as('tasks');
        if (req.body.id) this.where('tasks.id', req.body.id);
        else if (req.body.ids) this.whereIn('tasks.id', req.body.ids);
    });
    if (req.body.skills) q.andWhere('tasks.skills_ids', (req.body.filters && req.body.filters.for_approving)
        ||req.body.completed_skills ? '<@' : '&&', req.body.skills);
    q.leftJoin('users', 'tasks.author', '=', 'users.id').select('users.name as author_name');
    q.leftJoin('tasks_meta as tm', {'tasks.id': 'tm.task_id', 'tm.user_id': req.user.id}).select('done', 'approved', 'created', 'received', 'liked');
    if (req.body.filters) {
        if (req.body.filters.for_solving || req.body.filters.is_approved === true) q.andWhere('tasks.is_approved', true);
        else if (req.body.filters.is_approved === false) q.andWhere('tasks.is_approved', false);
        // Не менять на просто else, чтобы можно было загружать все задания, указав в is_approved любое,
        // отличное от true, false или undefined значение
        else if (req.body.filters.for_approving || req.body.filters.is_approved === undefined) q.whereNull('tasks.is_approved');

        if (req.body.filters.for_solving || req.body.filters.for_approving ||  req.body.filters.not_in_created) q.whereNull('created');
        if (req.body.filters.for_approving || req.body.filters.not_in_approved) q.whereNull('approved');
        if (req.body.filters.for_solving || req.body.filters.not_in_done) q.whereNull('done');

        if (req.body.filters.received === true) q.andWhere('received', true);
        else if (req.body.filters.received === false) q.whereNull('received');

        if (req.body.filters.liked === true) q.andWhere('liked', true);
        else if (req.body.filters.liked === false) q.whereNull('liked');
    }
    q.limit(20).offset(req.body.offset || 0);

    q.then(function(rows) {
        if (!rows) res.end();
        else res.end(JSON.stringify(rows));
    }).catch(function (error) {
        console.log(error);
        res.end();
    });
};