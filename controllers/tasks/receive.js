
module.exports = function(knex, updateArray) {
    return function(req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.attributes.tasks_created && req.user.attributes.tasks_created.indexOf(req.body.task_id) !== -1
                || req.user.attributes.tasks_done && req.user.attributes.tasks_done.indexOf(req.body.task_id) !== -1) {
                res.end();
                return;
            }
            knex('tasks').where('id', '=', req.body.task_id).select('is_approved').then(function(tasks) {
                if (!tasks[0].is_approved) {
                    res.end();
                    return;
                }
                knex('users').where('id', '=', req.user.id).andWhere('tasks_received', '@>', [req.body.task_id]).select('id')
                    .then(function (rows) {
                        var operation = rows.length === 0 ? 'append' : 'remove';
                        updateArray('users', 'tasks_received', req.user.id, operation, req.body.task_id).then(function () {
                            updateArray('tasks', 'participants', req.body.task_id, operation, req.user.id).then(function () {
                                res.end('ok');
                            }).catch(function (error) {
                                console.log(error);
                                res.end();
                            });
                        }).catch(function (error) {
                            console.log(error);
                            res.end();
                        });
                    }).catch(function (error) {
                        console.log(error);
                        res.end();
                    });
            }).catch(function (error) {
                console.log(error);
                res.end();
            });
        } else res.end();
    };
};